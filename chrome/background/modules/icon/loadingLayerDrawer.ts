const SPEED = 0.5;    // rounds/sec
const FADE_LENGTH = 300;    // millisec

var context: CanvasRenderingContext2D;

// when calling setOn or setOff, these values are manipulated
// end is set to a later point, so when initial setOff is received, NO animation happens
var start = 0;    // start of start animation
var end = 1;    // start of end animation

/**
 * @param millis the time at when the animation is rendered
 * @return true if animation has finished
 */
function render(millis: number) {
    const rotPos = ((millis / 1000.0) * 2 * Math.PI * SPEED) % (2 * Math.PI);
    const alpha = calcAlpha(millis);
    const r = context.canvas.width / 2;

    context.lineWidth = r / 3;
    context.strokeStyle = "rgba(0,0,255," + alpha + ")";

    context.beginPath();
    context.arc(r, r, r - context.lineWidth / 2, rotPos, rotPos + Math.PI * 0.66);
    context.stroke();

    context.beginPath();
    context.arc(r, r, r - context.lineWidth / 2, rotPos + Math.PI, rotPos + Math.PI * 1.66);
    context.stroke();

    // animation should go on until the layer totally disappears
    if (!alpha) {
        return true;
    }

    return false;
}

function setCanvas(canvas: HTMLCanvasElement) {
    context = canvas.getContext("2d");
}

function setOn() {
    if (end < start) return;    //animation already finished|happening
    start = Date.now();
}
function setOff() {
    if (start < end) return;    //animation already finished|happening
    end = Date.now();
}

/** @return the alpha value for given millis */
function calcAlpha(millis: number) {
    var fadeInAlpha = (millis - start) / FADE_LENGTH;
    fadeInAlpha = (fadeInAlpha < 0) ? 0 : fadeInAlpha;
    fadeInAlpha = (fadeInAlpha > 1) ? 1 : fadeInAlpha;

    var fadeOutAlpha = 1 - (millis - end) / FADE_LENGTH;
    fadeOutAlpha = (fadeOutAlpha < 0) ? 0 : fadeOutAlpha;
    fadeOutAlpha = (fadeOutAlpha > 1) ? 1 : fadeOutAlpha;

    if (start < end) {
        // end is next => tend to disappear => prefer the LOWER alpha
        return (fadeInAlpha < fadeOutAlpha) ? fadeInAlpha : fadeOutAlpha;
    }
    if (end < start) {
        // start is next => tend to appear => prefer the HIGHER alpha
        return (fadeInAlpha < fadeOutAlpha) ? fadeOutAlpha : fadeInAlpha;
    }
    return 1;
}

export { setCanvas, setOn, setOff, render }