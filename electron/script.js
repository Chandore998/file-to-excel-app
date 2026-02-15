const dropZone = document.getElementById("dropZone");
const fileList = document.getElementById("fileList");
const fileListContainer = document.getElementById("fileListContainer");
const fileCount = document.getElementById("fileCount");
let droppedFiles = [];

// Get file extension
function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

// Get file icon based on extension
function getFileIcon(filename) {
  const ext = getFileExtension(filename);
  const iconMap = {
    pdf: '📄',
    doc: '📘', docx: '📘', txt: '📝',
    xls: '📊', xlsx: '📊', csv: '📊',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
    zip: '📦', rar: '📦',
    mp3: '🎵', mp4: '🎬', avi: '🎬',
    exe: '⚙️', msi: '⚙️', app: '⚙️'
  };
  return iconMap[ext] || '📎';
}

// Handle drop zone click - use Electron's file dialog
dropZone.addEventListener("click", async () => {
  try {
    const files = await window.electronAPI.pickFiles();
    if (files.length === 0) return;
    
    for (let file of files) {
      console.log('File picked from dialog:', { name: file.name, path: file.path });
      
      const entry = { name: file.name, path: file.path, size: file.size || 0, originalPath: file.path, status: 'queued', result: null, resultPath: null, savedPath: null };
      droppedFiles.push(entry);
      const idx = droppedFiles.length - 1;
      console.log('Added file entry:', { idx, path: entry.path, entry });
      renderFileList();

      // // If we have a usable original path, start conversion immediately
      // if (entry.originalPath) {
      //   startConvert(idx);
      // }
    }
  } catch (err) {
    console.error('Error picking files:', err);
  }
});

// Handle file input selection - REMOVED in favor of file dialog
// fileInput is now unused and can be removed from HTML

window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("drop", e => e.preventDefault());

dropZone.addEventListener("dragover", () => {
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", async (event) => {
  dropZone.classList.remove("dragover");

  const files = event.dataTransfer.files;
  if (files.length === 0) return;

  for (let file of files) {
    // In Electron, dragged File objects have .path property
    const filePath = file.path;
    console.log('File dropped:', { name: file.name, path: filePath, size: file.size });
    
    if (!filePath) {
      console.error('Dropped file has no path property:', file);
      continue;
    }

    const entry = { name: file.name, path: filePath, size: file.size, originalPath: filePath, status: 'queued', result: null, resultPath: null, savedPath: null };
    droppedFiles.push(entry);
    const idx = droppedFiles.length - 1;
    console.log('Added dropped file entry:', { idx, path: filePath, entry });
    
    // // If we have a usable original path, start conversion immediately
    // if (entry.originalPath) {
    //   startConvert(idx);
    // }
  }

  renderFileList();
});

// Start conversion for a queued file by index
async function startConvert(index) {
  const file = droppedFiles[index];
  if (!file || file.status === 'converting') return;

  // Determine a usable input path
  const inputPath = file.originalPath;
  console.log('startConvert called for index:', index, 'file:', file);
  
  if (!inputPath) {
    console.error('No file path available for conversion', { file, index });
    droppedFiles[index].status = 'error';
    droppedFiles[index].result = 'File path not available. Try selecting the file again.';
    renderFileList();
    return;
  }

  droppedFiles[index].status = 'converting';
  renderFileList();

  try {
    const outPath = await window.electronAPI.convertFile(inputPath);
    droppedFiles[index].status = 'done';
    droppedFiles[index].resultPath = outPath;
    droppedFiles[index].result = `Converted - Ready to download`;
  } catch (err) {
    droppedFiles[index].status = 'error';
    droppedFiles[index].result = err && err.message ? err.message : String(err);
    console.error('convert-file error', err);
  }

  renderFileList();
}

function renderFileList() {
  if (droppedFiles.length === 0) {
    fileListContainer.style.display = "none";
    return;
  }

  fileListContainer.style.display = "block";
  fileCount.textContent = droppedFiles.length;
  
  fileList.innerHTML = droppedFiles.map((file, index) => `
    <div class="file-item ${file.status === 'converting' ? 'converting' : ''}">
      <span class="file-icon">${getFileIcon(file.name)}</span>
      <div class="file-details">
        <div class="file-name">${file.name}</div>
        <div class="file-info">
          <span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>
          <span class="file-status">${file.status || ''}</span>
        </div>
        ${file.result ? `<div class="file-result">${escapeHtml(String(file.result))}</div>` : ''}
      </div>
      <div class="file-actions">
        ${file.status === 'converting' ? `<div style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; color: #a16207; font-weight: 600; font-size: 13px;"><span style="animation: spin 1s linear infinite; display: inline-block;">⚙️</span>Converting...</div>` : (file.status === 'done' || file.status === 'saved' ? `<button class="download-btn" data-index="${index}" title="Download your converted file">⬇️ Download</button>` : `<button class="convert-btn" data-index="${index}" title="Start conversion">⚡ Convert</button>`) }
        <button class="delete-btn" data-index="${index}" title="Delete file" ${file.status === 'converting' ? 'disabled' : ''}>✕</button>
      </div>
    </div>
  `).join("");

  // Attach delete event listeners
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.getAttribute("data-index"));
      deleteFile(index);
    });
  });

  // Attach convert event listeners
  document.querySelectorAll(".convert-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"));
      startConvert(idx);
    });
  });

  // Attach download event listeners
  document.querySelectorAll(".download-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"));
      const entry = droppedFiles[idx];
      if (!entry || !entry.resultPath) return;

      try {
        const saved = await window.electronAPI.saveFile(entry.resultPath, `${entry.name.replace(/\.[^.]+$/, '')}.xlsx`);
        if (saved) {
          droppedFiles[idx].savedPath = saved;
          droppedFiles[idx].status = 'saved';
          droppedFiles[idx].result = `File saved to: ${saved}`;
          renderFileList();
        }
      } catch (err) {
        droppedFiles[idx].status = 'error';
        droppedFiles[idx].result = err && err.message ? err.message : String(err);
        renderFileList();
      }
    });
  });
}

// Simple HTML escape to safely show converter output
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function deleteFile(index) {
  droppedFiles.splice(index, 1);
  renderFileList();
}
