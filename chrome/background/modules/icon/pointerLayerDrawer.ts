const FADE_LENGTH = 300; // millisec

var context: OffscreenCanvasRenderingContext2D;
var size: number;

interface Fade {
    startTime: number,
    duration: number,
    startAlpha: number,
    endAlpha: number
}

var fade: Fade
var renderedAlpha = 0;

function setCanvas(canvas: OffscreenCanvas) {
    context = canvas.getContext("2d");
    size = canvas.width;
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
/** @param millis the time at when the animation is rendered
 * @return true ifanimation has finished*/
function render(millis: number) {
    var alpha = calcAlpha(millis);
    context.lineWidth = 3.33;
    context.strokeStyle = "rgba(0,0,0," + alpha + ")";
    context.fillStyle = "rgba(255,255,255," + alpha + ")";
    context.save();
    context.scale(size / 32, size / 32); //pointer is defined in a 32x32 grid, where top is in the origin
    context.translate(15, 15); //move origin to center (not exavtly to center: top of pointer should cover the middle)
    context.rotate(-45 * Math.PI / 180); //45 degrees rotation
    context.scale(.6, .6); //we actually use the 60% of the size of the pointer (see icon32On)
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(-10, 25);
    context.lineTo(-4, 24);
    context.lineTo(-4, 32);
    context.lineTo(4, 32);
    context.lineTo(4, 24);
    context.lineTo(10, 25);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();

    renderedAlpha = alpha;
    if(millis > fade.startTime && fade.endAlpha === renderedAlpha) {
        return true;
    }
}

export { setCanvas, setOn, setOff, render }

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
