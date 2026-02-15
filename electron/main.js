const { ipcMain, dialog } = require('electron')
const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')
const os = require('os')
const { execFile } = require('child_process')
const fs = require('fs/promises')

async function awaitExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch (e) {
    return false;
  }
}

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // preload and index.html are located in the project root (one level up)
      preload: path.join(__dirname,'preload.js')
    }
  })

  win.removeMenu()
  // load index.html from the project root directory
  win.loadFile(path.join(__dirname,'index.html'))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle dropped files
ipcMain.handle("file-dropped", async (_, file) => {
  console.log('file-dropped handler received:', file);
  return file;
});

// Handle selected files
ipcMain.handle("file-selected", async (_, filePaths) => {
  console.log('file-selected handler received:', filePaths);
  return filePaths;
});

ipcMain.handle("convert-file", async (_, filePath) => {
  // Determine rust binary name based on platform
  const rustBinary =
    process.platform === "win32"
      ? "rust-core.exe"
      : "rust-core";

  // Resolve path to converter executable for dev vs packaged app.
  let rustExe;
  if (app.isPackaged) {
    // When packaged, look for the exe in common unpacked locations:
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'rust-core', 'target', 'release', rustBinary);
    const extraResourcesPath = path.join(process.resourcesPath, 'rust-core', 'target', 'release', rustBinary);
    if (await awaitExists(unpacked)) rustExe = unpacked;
    else if (await awaitExists(extraResourcesPath)) rustExe = extraResourcesPath;
    else rustExe = unpacked; // fallback path for clear error message
  } else {
    // Development layout: sibling rust-core folder
    rustExe = path.join(__dirname, '..', 'rust-core', 'target', 'release', rustBinary);
  }

  const cwd = path.dirname(rustExe);

  // Ensure the converter binary exists
  try {
    await fs.access(rustExe);
  } catch (err) {
    throw new Error(`Converter executable not found at ${rustExe}. When packaging, ensure the executable is marked to be unpacked (asarUnpack) or placed in resources.`);
  }

  // Ensure the input file exists before invoking the converter
  try {
    await fs.access(filePath);
  } catch (err) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  return new Promise((resolve, reject) => {
    execFile(rustExe, [filePath], { cwd }, async (err, stdout, stderr) => {
      if (err) {
        // include stderr in the error for better diagnostics
        err.message = `${err.message}\nstderr: ${String(stderr || '')}`;
        return reject(err);
      }

      const base64String = String(stdout || '').trim();
      
      // Decode base64 to buffer
      let fileBuffer;
      try {
        fileBuffer = Buffer.from(base64String, 'base64');
      } catch (e) {
        return reject(new Error(`Failed to decode converter output: ${e.message}`));
      }

      // Write to a temporary file for the user to download
      try {
        const tempDir = os.tmpdir();
        const tempOutputPath = path.join(tempDir, `converted_${Date.now()}.xlsx`);
        await fs.writeFile(tempOutputPath, fileBuffer);
        resolve(tempOutputPath);
      } catch (e) {
        reject(new Error(`Failed to write output file: ${e.message}`));
      }
    });
  });
});

// Save (download) converted file to user-selected location
ipcMain.handle('save-file', async (_, { srcPath, suggestedName }) => {
  try {
    const { canceled, filePath: dest } = await dialog.showSaveDialog({
      defaultPath: suggestedName || path.basename(srcPath)
    });

    if (canceled || !dest) return null;

    await fs.copyFile(srcPath, dest);
    return dest;
  } catch (err) {
    throw err;
  }
});

// Prompt user to pick files using Electron's file dialog (returns actual file paths)
ipcMain.handle('pick-files', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select CSV files to convert',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (canceled || !filePaths || filePaths.length === 0) return [];
  
  // Return array of file objects with name and path
  return filePaths.map(filePath => ({
    name: path.basename(filePath),
    path: filePath,
    size: 0  // Size will be determined by renderer if needed
  }));
});