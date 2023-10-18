const { contextBridge, ipcRenderer } = require('electron')


let playStatus = {
  updateStatus: (streamStatus) => ipcRenderer.on("updateStatus", (streamStatus))
}

contextBridge.exposeInMainWorld("playStatus", playStatus)

contextBridge.exposeInMainWorld('electronAPI', {
  playStream: (content) => ipcRenderer.send('play-stream', content),
  stopStream: () => ipcRenderer.send('stop-stream')
})