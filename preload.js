const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  playStream: (content) => ipcRenderer.send('play-stream', content),
  stopStream: () => ipcRenderer.send('stop-stream')
})