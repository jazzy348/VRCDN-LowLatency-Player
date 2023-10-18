const openStream = document.getElementById('openStream')
const rtspUrl = document.getElementById('rtspUrl')
openStream.addEventListener('click', () => {
    const content = rtspUrl.value
    window.electronAPI.playStream(content)
})

const stopStream = document.getElementById('stopStream')
stopStream.addEventListener('click', () => {
    window.electronAPI.stopStream();
})

window.playStatus.updateStatus((event, playStatus) => {
    document.getElementById("playStatus").innerText=playStatus
})