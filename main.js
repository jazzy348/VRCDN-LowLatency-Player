const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const spawn = require('child_process').spawn
const exec = require('child_process').exec

let processId = 0;
let curStream = "";

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
  })
  mainWindow.setIcon('./resources/icon.png')
  ipcMain.on('play-stream', (event, content) => {
    openMpv(content)
  })

  mainWindow.loadFile('index.html')

  mainWindow.webContents.on('did-finish-load', () => {
    getAudioDevices()
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  //if (process.platform !== 'darwin') app.quit()
  app.quit();
})

function openMpv(content) {
  if (processId !== 0) {
      console.log("Killing Mpv")
      process.kill(processId)
      return;
  }
  console.log(content)
  //Removed this as it caused some streams to not work
  //playParams = ['-rtsp_transport', 'tcp', `rtsp://stream.vrcdn.live/live/${content}`, '-nostats', '-flags', 'low_delay', '-nodisp', '-probesize', '32', '-fflags', 'nobuffer+fastseek+flush_packets', '-analyzeduration', '0']
  playParams = [ '--no-video', '--profile=low-latency', '--no-cache', `--audio-device=${content.audioDevice}`, '--rtsp-transport=tcp', `rtsp://stream.vrcdn.live/live/${content.streamName}` ]
  Mpv = spawn(`./lib/mpv/mpv.exe`, playParams)
  processId = Mpv.pid
  curStream = content.streamName
  mainWindow.webContents.send("updateStatus", `Status: <font color="cyan">Playing ${content.streamName}</font>`)
  mainWindow.webContents.send("buttonText", `Stop`)
  Mpv.stdout.on('data', function (data) {
    //console.log(data.toString())
  })

  Mpv.stderr.on('data', function (data) {
    if (data.toString().includes("401 Unauthorized") || data.toString().includes("404 Stream Not Found")) {
      processId = 0;
      mainWindow.webContents.send("updateStatus", `Status: <font color="red">Error playing ${content.streamName}, stream does not exist or is offline</font>`)
    }
  })

  Mpv.on('close', function (data) {
    if (processId !== 0) {
      processId = 0;
      mainWindow.webContents.send("updateStatus", `Status: Idle.`)
    }
    mainWindow.webContents.send("buttonText", `Play`)
    mainWindow.webContents.send("viewerCount", `Viewers: 0`)
    curStream = "";
    console.log(data.toString())
  })
}

async function getAudioDevices() {
  exec("mpv --audio-device=help", { cwd: './lib/mpv/'}, function(err, stdout, stderr) {
    let toSend = []
    audioDevices = stdout.split(/\r?\n/)
    audioDevices.forEach(device => {
      if (device.includes("wasapi")) {
        toSend.push({"deviceId": device.split(`' `)[0].replace(`  '`, ''), "deviceName": device.split(`' `)[1]})
      }
    });
    mainWindow.webContents.send("audioDevices", toSend)
  })
}

//Viewer stuff
async function getViewers() {
  if (curStream !== "") {
    fetch("https://api.vrcdn.live/v1/viewers/"+curStream)
    .then(resp => resp.json())
    .then(resp => {
        let total = 0;
        for (let i = 0; i < resp.viewers.length; i++) {
            total = total + resp['viewers'][i].total
        }
        mainWindow.webContents.send("viewerCount", `Viewers: ${total}`)
    })
  }
}

async function asyncInterval(callback, delay) {
  while (true) {
    try {
      await callback();
    } catch (err) {
      console.log("[DEBUG] Something went wrong with " + err);
    }
    await new Promise((r) => setTimeout(r, delay));
  }
}

//I leave this loop running even when no stream is being played, this is bad but also the perf hit is so tiny it's meh.
//I mentioned it was jank, have I convinced you yet? I'll rewrite this properly at some point
asyncInterval(getViewers.bind(null), 5000);
