const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  handleFileDrop: (file) => ipcRenderer.invoke("file-dropped", file),
  selectFile: (filePaths) => ipcRenderer.invoke("file-selected", filePaths),
  convertFile: (filePath) => ipcRenderer.invoke("convert-file", filePath),
  saveFile: (srcPath, suggestedName) => ipcRenderer.invoke("save-file", { srcPath, suggestedName }),
  pickFiles: () => ipcRenderer.invoke('pick-files'),
});