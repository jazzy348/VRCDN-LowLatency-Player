const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const spawn = require('child_process').spawn
let processId = 0;

function createWindow () {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
  })

  ipcMain.on('play-stream', (event, content) => {
    openFFplay(content)
  })

  ipcMain.on('stop-stream', (event, content) => {
    if (processId !== 0) {
      console.log("Killing FFPlay")
      process.kill(processId)
    } else {
    }
  })

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('windotestw-all-closed', function () {
  //if (process.platform !== 'darwin') app.quit()
  if (processId !== 0) {
    process.kill(processId)
  }
  app.quit();
})

function openFFplay(content) {
  if (processId !== 0) return;
  const playParams = ['-rtsp_transport', 'tcp', `rtsp://stream.vrcdn.live/live/${content}`, '-nostats', '-flags', 'low_delay', '-nodisp', '-probesize', '32', '-fflags', 'nobuffer+fastseek+flush_packets', '-analyzeduration', '0', '-sync', 'ext', '-af', 'aresample=async=1:min_comp=0.1:first_pts=0']
  ffPlay = spawn(`ffplay.exe`, playParams)
  processId = ffPlay.pid

  ffPlay.stdout.on('data', function (data) {
    //onsole.log(data)
  })

  ffPlay.stderr.on('data', function (data) {
    if (data.toString().includes("401 Unauthorized")) {
      options = {
        type: "error",
        buttons: ['Ok'],
        defaultId: 2,
        title: "Error",
        message: "Error opening stream",
        detail: "The stream you tried to open either does not exist or is not currently live. Please double check the stream name you entered and try again."
      }
      dialog.showMessageBox(null, options)
    }
  })

  ffPlay.on('close', function (data) {
    processId = 0;
  })
  
}