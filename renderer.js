//Handle grabbing the stream name input, wait for the button press and then send it to the backend
const playStop = document.getElementById('playStop')
const rtspUrl = document.getElementById('rtspUrl')
const audioDevice = document.getElementById('audioDevice')
playStop.addEventListener('click', () => {
    const content = { "streamName": rtspUrl.value, "audioDevice": audioDevice.value}
    window.electronAPI.playStream(content)
})

//Audio device stuffs
window.audioDevices.audioDevices((event, audioDevices) => {
    deviceDropdown = document.getElementById("audioDevice")
    for (var i = 0; i<=audioDevices.length; i++){
        var opt = document.createElement('option');
        opt.value = audioDevices[i].deviceId;
        opt.innerHTML = audioDevices[i].deviceName;
        deviceDropdown.appendChild(opt);
    }
})

//Handle the bottom left MPV status
window.playStatus.updateStatus((event, playStatus) => {
    document.getElementById("playStatus").innerHTML=playStatus
})

//Handle the play / stop button text
window.buttonText.buttonText((event, buttonText) => {
    document.getElementById("playStop").innerHTML=buttonText
})

//Handle viewer count
window.viewerCount.viewerCount((event, viewerCount) => {
    document.getElementById("viewerCount").innerHTML=viewerCount
})