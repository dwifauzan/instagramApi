const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    // selectDownloadDirectory: () =>
    //     ipcRenderer.invoke('selectDownloadDirectory'),
    startDownload: (nameArsip, feed, signal) =>
        ipcRenderer.invoke('startDownload', nameArsip, feed, signal),
    getFeedData: () => ipcRenderer.invoke('getFeedData'),
    
    createAccount: (accountForm) => ipcRenderer.invoke("createAccount", accountForm),
    handlerCokies: (dataCokies) => ipcRenderer.invoke("handlerCokiess", dataCokies),
    getAllUsers: (args) => ipcRenderer.invoke("getAllUsers", args),
    deleteUsers: (id) => ipcRenderer.invoke("deleteUsers", id),
    sinkronUsers: (id) => ipcRenderer.invoke("sinkronUsers", id),

    //instagram
    handleLogin: (dataLogin) => ipcRenderer.invoke("handleLogin", dataLogin),
    getAllUsersInstagram: (args) => ipcRenderer.invoke("getAllUsersInstagram", args),
    loginPrivate: (userLogin) => ipcRenderer.invoke("loginPrivate", userLogin),
    logoutUsers: (id) => ipcRenderer.invoke("logoutUsers", id),
    deleteUsersIg: (id) => ipcRenderer.invoke("deleteUsersIg", id),

    //instagram riset
    search: (dataSearch) => ipcRenderer.invoke("search", dataSearch),
    getFeedsByHastag: (dataHastags) => ipcRenderer.invoke("getFeedsByHastag", dataHastags),
    getFeedsByUsername: (dataAccount) => ipcRenderer.invoke("getFeedsByUsername", dataAccount),
    getFeedsByLocation: (dataLocation) => ipcRenderer.invoke("getFeedsByLocation", dataLocation),

    //arsip
    handleArsip: (dataArsip) => ipcRenderer.invoke("handleArsip", dataArsip),
    deleteFolderArsip: (id) => ipcRenderer.invoke("deleteFolderArsip", id),

    //repost
    handleRepostLangsung: (dataRepostL) => ipcRenderer.invoke("handleRepostLangsung", dataRepostL),
    handleRepostSchedule: (dataRepostS) => ipcRenderer.invoke("handleRepostSchedule", dataRepostS)
})
