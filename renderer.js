const playStop = document.getElementById('playStop')
const rtspUrl = document.getElementById('rtspUrl')
playStop.addEventListener('click', () => {
    const content = rtspUrl.value
    window.electronAPI.playStream(content)
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