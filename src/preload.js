const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fileChecker', {
  pickFolder: () => ipcRenderer.invoke('folder:pick'),
  collectMissingFiles: (payload) => ipcRenderer.invoke('missing:collect', payload)
});
