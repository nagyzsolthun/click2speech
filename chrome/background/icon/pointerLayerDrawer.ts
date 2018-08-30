import * as RGBA from "./RGBA";

const FADE_DURATION = 300; // millisec

var context: CanvasRenderingContext2D;
var size: number;

// when calling setOn or setOff, these values are manipulated
var start = 0; // start of start animation
var end = 1; // start of end animation; end is set to a later point, so when initial setOn is received, animation happens

function setCanvas(canvas: HTMLCanvasElement) {
    context = canvas.getContext("2d");
    size = canvas.width;
}
function setOn() {
    if (end < start) return; //animation already finished/happening
    start = Date.now();
}
function setOff() {
    if (start < end) return; //animation already finished/happening
    end = Date.now();
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
    return hasAnimationFinished(millis);
}

export { setCanvas, setOn, setOff, render }

/** @return the alpha value forgiven millis */
function calcAlpha(millis: number) {
    var fadeInAlpha = (millis - start) / FADE_DURATION;
    fadeInAlpha = (fadeInAlpha < 0) ? 0 : fadeInAlpha;
    fadeInAlpha = (fadeInAlpha > 1) ? 1 : fadeInAlpha;
    var fadeOutAlpha = 1 - (millis - end) / FADE_DURATION;
    fadeOutAlpha = (fadeOutAlpha < 0) ? 0 : fadeOutAlpha;
    fadeOutAlpha = (fadeOutAlpha > 1) ? 1 : fadeOutAlpha;
    if (start < end) {
        //end is next => tend to disappear => prefer the LOWER alpha
        return (fadeInAlpha < fadeOutAlpha) ? fadeInAlpha : fadeOutAlpha;
    }
    if (end < start) {
        //start is next => tend to appear => prefer the HIGHER alpha
        return (fadeInAlpha < fadeOutAlpha) ? fadeOutAlpha : fadeInAlpha;
    }
    return 1;
}
/** @return true ifanimation finished */
function hasAnimationFinished(millis: number) {
    if (millis < start + FADE_DURATION) return false;
    if (millis < end + FADE_DURATION) return false;
    return true;
}
