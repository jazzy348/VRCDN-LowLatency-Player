const { contextBridge, ipcRenderer } = require('electron')

let playStatus = {
  updateStatus: (streamStatus) => ipcRenderer.on("updateStatus", (streamStatus))
}
let buttonText = {
  buttonText: (buttonText) => ipcRenderer.on("buttonText", (buttonText))
}
contextBridge.exposeInMainWorld("playStatus", playStatus)
contextBridge.exposeInMainWorld("buttonText", buttonText)
contextBridge.exposeInMainWorld('electronAPI', {
  playStream: (content) => ipcRenderer.send('play-stream', content),

})