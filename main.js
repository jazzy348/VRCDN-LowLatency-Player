//Hey hey! Thank you for taking interest in this janky app!
//I wrote this very quickly after a few Discord DMs from a few VJs when pulling in the performers stream
//This code is JANK! Feel free to submit a pull request and clean it up. I'll clean it up when I get time
//Trust in the tiny hats, Jazzy.

//PS. The build process isn't fully automated. After running "npm run build" copy the resources and lib dir to dist/win-unpacked DIR
//Then write a version file that contains the build version in the dist/win-unpacked dir.
//Yes, this is awful. Yes I hate it. I will fix it when I get more than 5s to work on this

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const spawn = require('child_process').spawn
const exec = require('child_process').exec
const fetch = require('node-fetch')

let processId = 0; //Keep track of the process ID so we can kill it later
let curStream = ""; //Used by the viewer grabbing.

//Globally expose the userland window to the full app
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

  //Once everything has finished rendered, grab the audio devices and check if a new build is available
  mainWindow.webContents.on('did-finish-load', () => {
    getAudioDevices()
    checkUpdate()
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

//Handle spawning the MPV process
function openMpv(content) {
  //If MPV already exists, kill it
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
    //This isn't used as MPV shouts to STDErr only :Facepalm:
    //console.log(data.toString())
  })

  Mpv.stderr.on('data', function (data) {
    //VRCDN sends 401 or 404 if the stream isn't live. Check for that in the output of MPV and show error if needed
    if (data.toString().includes("401 Unauthorized") || data.toString().includes("404 Stream Not Found")) {
      processId = 0;
      mainWindow.webContents.send("updateStatus", `Status: <font color="red">Error playing ${content.streamName}, stream does not exist or is offline</font>`)
    }
  })

  //If MPV closes for any reason, reset user land button and viewer count
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
        //Lets hope MPV doesn't change the output of the devices
        toSend.push({"deviceId": device.split(`' `)[0].replace(`  '`, ''), "deviceName": device.split(`' `)[1]})
      }
    });
    mainWindow.webContents.send("audioDevices", toSend)
  })
}

//Check for update, if error then continue
async function checkUpdate() {
  try {
    data = fs.readFileSync('./version')
    fetch('https://vrcdnllp.jazzy.land/getVersion', {
      method: "get",
      headers: {"User-Agent": `VRCDN-LowLatency-Player - ${data}`}
    }).then(resp => resp.json())
    .then(resp => {
      if (data != resp.version) {
        options = {
          type: "info",
          defaultId: 1,
          buttons: ['Ok', "Download"],
          title: "New Version Available",
          message: "A new version of this app is available, please download it from the repo."
        }
        dialog.showMessageBox(null, options).then(data => {
          if (data.response == 1) {
            shell.openExternal("https://github.com/jazzy348/VRCDN-LowLatency-Player/releases")
          }
        })
      }
    })
  } catch (e) {
    console.log(e)
  }
}

//Grab current viewers from VRCDN's API and send it to user land
//Honestly, this is kinda pointless...but who knows, maybe I'll repurpose this app is a web radio app :D
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
      }).catch (e => {
        console.log(e)
        mainWindow.webContents.send("viewerCount", `Error getting viewers`)
      })
  }
}

//setTimeout, but async and waits for the function to finish before restarting the wait
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
