const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    // selectDownloadDirectory: () =>
    //     ipcRenderer.invoke('selectDownloadDirectory'),
    startDownload: (nameArsip, feed, signal) =>
        ipcRenderer.invoke('startDownload', nameArsip, feed, signal),
    getFeedData: () => ipcRenderer.invoke('getFeedData'),
})
