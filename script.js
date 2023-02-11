
var playing = false
var stemLevel = 1;
var maxStems = 3;

var oldUpdateTime

var audioCtx = null
var audioNodes = []

window.addEventListener("DOMContentLoaded", () => {
    for (let i = 0; i < maxStems; i++)
        createStemSlot(i);

    changeStemLevel(0)
    oldUpdateTime = new Date().getTime()
    window.requestAnimationFrame(update)
})

window.addEventListener("click", (e) => audioCtx = audioCtx || new AudioContext())

function clearAudioNode(audioIndex) {
    nodes = audioNodes[audioIndex]
    if (nodes) {
        nodes.source.stop()
        nodes.source.disconnect()
        nodes.gain.disconnect()

        audioNodes[audioIndex] = null
    }
}

function createStemSlot(audioIndex) {
    if (audioIndex < 0 || audioIndex >= maxStems) {
        console.warn("Attempted to create stem with negative or over max audio index: " + audioIndex)
        return
    }

    const wrapper = document.createElement("div")

    const input = document.createElement("input");
    input.onchange = (e) => onStemChanged(e, audioIndex)
    input.type = "file"
    input.accept = "audio/*"

    const reset = document.createElement("button")
    reset.innerText = "Clear"
    reset.onclick = (e) => {
        input.value = null
        clearAudioNode(audioIndex)
    }

    wrapper.appendChild(reset)
    wrapper.appendChild(input)
    document.body.appendChild(wrapper);
}

function onStemChanged(args, audioIndex) {
    clearAudioNode(audioIndex)

    const gain = audioCtx.createGain()
    gain.gain.value = 0
    gain.connect(audioCtx.destination)

    const source = audioCtx.createBufferSource()
    source.loop = true
    source.connect(gain)

    audioNodes[audioIndex] = { source, gain }

    const reader = new FileReader();
    reader.onload = (e) => {
        const buffer = e.target.result
        audioCtx.decodeAudioData(buffer, (audioBuffer) => source.buffer = audioBuffer);
    }

    reader.readAsArrayBuffer(args.srcElement.files[0])
}

function update() {
    window.requestAnimationFrame(update)

    const newFrameTime = new Date().getTime()
    const dt = (newFrameTime - oldUpdateTime) / 1000
    oldUpdateTime = newFrameTime;

    if (!playing)
        return

    for (let i = 0; i < maxStems; i++) {
        if (!audioNodes[i])
            continue

        const gain = audioNodes[i].gain
        if (i < stemLevel)
            gain.gain.value = Math.min(gain.gain.value + dt, 1)
        else
            gain.gain.value = Math.max(gain.gain.value - dt, 0)
    }
}

function changeStemLevel(amount) {
    stemLevel = Math.min(Math.max(stemLevel + amount, 0), maxStems)
    document.getElementById("stem-level").textContent = `Stem level: ${stemLevel}`;
}

function play() {
    if (playing) return
    playing = true

    for (const nodes of audioNodes) {
        try {
            nodes.source.start()
        } catch (err) {
            console.error(err)
        }
    }
}

function stop() {
    if (!playing) return
    playing = false

    for (const nodes of audioNodes)
        nodes.gain.gain.value = 0
}