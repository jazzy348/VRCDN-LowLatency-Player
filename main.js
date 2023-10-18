const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const spawn = require('child_process').spawn
let processId = 0;

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
  })
  mainWindow.setIcon('./icon.png')
  ipcMain.on('play-stream', (event, content) => {
    openFFplay(content)
  })

  ipcMain.on('stop-stream', (event, content) => {
    if (processId !== 0) {
      console.log("Killing FFPlay")
      process.kill(processId)
      mainWindow.webContents.send("updateStatus", `Status: Idle`)
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
  //Removed this as it caused some streams to not work
  //playParams = ['-rtsp_transport', 'tcp', `rtsp://stream.vrcdn.live/live/${content}`, '-nostats', '-flags', 'low_delay', '-nodisp', '-probesize', '32', '-fflags', 'nobuffer+fastseek+flush_packets', '-analyzeduration', '0', '-sync', 'ext', '-af', 'aresample=async=1:min_comp=0.1:first_pts=0']
  playParams = ['-rtsp_transport', 'tcp', `rtsp://stream.vrcdn.live/live/${content}`, '-nostats', '-flags', 'low_delay', '-nodisp', '-probesize', '32', '-fflags', 'nobuffer+fastseek+flush_packets', '-analyzeduration', '0']
  ffPlay = spawn(`ffplay.exe`, playParams)
  processId = ffPlay.pid
  mainWindow.webContents.send("updateStatus", `Status: Playing ${content}`)
  ffPlay.stdout.on('data', function (data) {
    //console.log(data)
  })

  ffPlay.stderr.on('data', function (data) {
    if (data.toString().includes("401 Unauthorized")) {
      processId = 0;
      mainWindow.webContents.send("updateStatus", `Status: Error playing ${content}, stream does not exist or is offline.`)
    }
  })

  ffPlay.on('close', function (data) {
    if (processId !== 0) {
      processId = 0;
      mainWindow.webContents.send("updateStatus", `Status: Idle.`)
    }
  })
}
