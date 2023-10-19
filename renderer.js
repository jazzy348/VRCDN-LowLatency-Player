const playStop = document.getElementById('playStop')
const rtspUrl = document.getElementById('rtspUrl')
const audioDevice = document.getElementById('audioDevice')
playStop.addEventListener('click', () => {
    const content = { "streamName": rtspUrl.value, "audioDevice": audioDevice.value}
    window.electronAPI.playStream(content)
})

window.audioDevices.audioDevices((event, audioDevices) => {
    deviceDropdown = document.getElementById("audioDevice")
    console.log(audioDevices)
    for (var i = 0; i<=audioDevices.length; i++){
        var opt = document.createElement('option');
        opt.value = audioDevices[i].deviceId;
        opt.innerHTML = audioDevices[i].deviceName;
        deviceDropdown.appendChild(opt);
    }
})

window.playStatus.updateStatus((event, playStatus) => {
    document.getElementById("playStatus").innerHTML=playStatus
})

window.buttonText.buttonText((event, buttonText) => {
    document.getElementById("playStop").innerHTML=buttonText
})

window.viewerCount.viewerCount((event, viewerCount) => {
    document.getElementById("viewerCount").innerHTML=viewerCount
})