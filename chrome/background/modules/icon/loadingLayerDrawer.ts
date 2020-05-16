const SPEED = 0.5;    // rounds/sec
const FADE_LENGTH = 300;    // millisec

var context: CanvasRenderingContext2D;

interface Fade {
    startTime: number,
    duration: number,
    startAlpha: number,
    endAlpha: number
}

var fade: Fade
var renderedAlpha = 0;

/**
 * @param millis the time at when the animation is rendered
 * @return true if animation has finished
 */
function render(millis: number) {
    const alpha = calcAlpha(millis);
    const rotPos = ((millis / 1000.0) * 2 * Math.PI * SPEED) % (2 * Math.PI);
    const r = context.canvas.width / 2;

    context.lineWidth = r / 3;
    context.strokeStyle = "rgba(0,0,255," + alpha + ")";

    context.beginPath();
    context.arc(r, r, r - context.lineWidth / 2, rotPos, rotPos + Math.PI * 0.66);
    context.stroke();

    context.beginPath();
    context.arc(r, r, r - context.lineWidth / 2, rotPos + Math.PI, rotPos + Math.PI * 1.66);
    context.stroke();

    renderedAlpha = alpha;
    if (millis > fade.startTime && !alpha) {
        return true;
    }
}

function setCanvas(canvas: HTMLCanvasElement) {
    context = canvas.getContext("2d");
}

function setOn() {
    fade = {
        startTime: Date.now(),
        duration: FADE_LENGTH,
        startAlpha: renderedAlpha,
        endAlpha: 1
    }
}
function setOff() {
    fade = {
        startTime: Date.now(),
        duration: FADE_LENGTH,
        startAlpha: renderedAlpha,
        endAlpha: 0
    }
}

/** @return the alpha value for given millis */
function calcAlpha(millis: number) {
    const relativeMillis = millis - fade.startTime;
    const ratio = relativeMillis / fade.duration;  // 0 means start of animation, 1 means end
    if(ratio < 0) {
        return fade.startAlpha;
    }
    if(ratio > 1) {
        return fade.endAlpha;
    }
    return fade.startAlpha + ratio * (fade.endAlpha - fade.startAlpha);
}

export { setCanvas, setOn, setOff, render }