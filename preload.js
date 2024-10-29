const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    selectDownloadDirectory: () =>
        ipcRenderer.invoke('selectDownloadDirectory'),
    startDownload: (url, downloadPath, feed) =>
        ipcRenderer.invoke('startDownload', url, downloadPath, feed),
})
