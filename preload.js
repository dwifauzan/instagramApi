const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    selectDownloadDirectory: () => ipcRenderer.invoke('selectDownloadDirectory'),
    downloadFile: (url, downloadPath, mediaType, caption) =>
        ipcRenderer.invoke('downloadFile', url, downloadPath, mediaType, caption),
});
