import RGBA from "./RGBA";

interface Icon {
    innerFill: RGBA;
    innerRing: RGBA;
    outerFill: RGBA;
    outerRing: RGBA;
}

interface Transition {
    from: Icon,
    to: Icon,
    length: number
}

interface Animation {
    start: number,
    transitions: Array<Transition>
}

const TURNED_OFF: Icon = {
    innerFill: RGBA.create({ a: 0.5 }),    //grey
    innerRing: RGBA.BLACK,
    outerFill: RGBA.TRANSPARENT,
    outerRing: RGBA.BLACK,
}

const TURNED_ON: Icon = {
    innerFill: RGBA.create({ g: 1 }),
    innerRing: RGBA.BLACK,
    outerFill: RGBA.TRANSPARENT,
    outerRing: RGBA.create({ r: 0.2, g: 0.2, b: 0.2 }),
}

const PLAYING: Icon = {
    innerFill: RGBA.create({ b: 1 }),
    innerRing: RGBA.BLACK,
    outerFill: RGBA.create({ b: 1, a: 0.5 }),
    outerRing: RGBA.create({ b: 0.5 }),
}

const ERROR: Icon = {
    innerFill: RGBA.create({ r: 1 }),
    innerRing: RGBA.BLACK,
    outerFill: RGBA.TRANSPARENT,
    outerRing: RGBA.BLACK,
}

const ERROR_ANIMATION: Icon = {
    innerFill: RGBA.create({ r: 1 }),
    innerRing: RGBA.BLACK,
    outerFill: RGBA.create({ r: 1 }),
    outerRing: RGBA.BLACK,
}

const LOADING: Icon = {
    innerFill: RGBA.TRANSPARENT,
    innerRing: RGBA.create({ a: 0.2 }),    //grey
    outerFill: RGBA.TRANSPARENT,
    outerRing: RGBA.TRANSPARENT,
}

const INTERACTION_ANIMATION: Icon = {
    innerFill: RGBA.create({ g: 0.7 }),
    innerRing: RGBA.BLACK,
    outerFill: RGBA.create({ g: 0.7 }),
    outerRing: RGBA.create({ r: 0.2, g: 0.2, b: 0.2 }),
}

const ANIMATION_LENGTH = 300;

var context: CanvasRenderingContext2D;
var size: number;
var quarter: number;    //should be size/4

var renderedIcon: Icon = TURNED_OFF;    //stores the last drawn state
var targetIcon: Icon = TURNED_OFF;    //in case an animation request comes in while animating, this icon is will be the end
var animation: Animation;    // current|last-finished animation

function setCanvas(canvas: HTMLCanvasElement) {
    context = canvas.getContext("2d");
    size = canvas.width;
    quarter = size / 4;
}

function setOn() {
    targetIcon = TURNED_ON;
    animation = { start: Date.now(), transitions: [{ from: renderedIcon, to: TURNED_ON, length: ANIMATION_LENGTH }] };
}

function setOff() {
    targetIcon = TURNED_OFF;
    animation = { start: Date.now(), transitions: [{ from: renderedIcon, to: TURNED_OFF, length: ANIMATION_LENGTH }] };
}

function setError() {
    targetIcon = ERROR;
    animation = { start: Date.now(), transitions: [{ from: renderedIcon, to: TURNED_OFF, length: ANIMATION_LENGTH }] };
}

function setPlaying() {
    targetIcon = PLAYING;
    animation = { start: Date.now(), transitions: [{ from: renderedIcon, to: PLAYING, length: ANIMATION_LENGTH }] };
}

function setLoading() {
    targetIcon = LOADING;
    animation = { start: Date.now(), transitions: [{ from: renderedIcon, to: LOADING, length: ANIMATION_LENGTH }] };
}

function animateError() {
    animation = {
        start: Date.now(), transitions: [
            { from: renderedIcon, to: ERROR_ANIMATION, length: 200 },
            { from: ERROR_ANIMATION, to: ERROR, length: 200 },
            { from: ERROR, to: ERROR_ANIMATION, length: 200 },
            { from: ERROR_ANIMATION, to: ERROR, length: 200 },
            { from: ERROR, to: ERROR_ANIMATION, length: 200 },
            { from: ERROR_ANIMATION, to: targetIcon, length: 200 },
        ]
    };
}

function animateInteraction() {
    animation = {
        start: Date.now(), transitions: [
            { from: renderedIcon, to: INTERACTION_ANIMATION, length: 200 },
            { from: INTERACTION_ANIMATION, to: targetIcon, length: 200 },
        ]
    };
}

/** @param millis the time at when the animation is rendered
 * @return true if animation has finished*/
function render(millis: number) {
    var icon = iconAt(millis);
    renderIcon(icon);
    return icon == targetIcon;
}

export { setCanvas, setOn, setOff, setError, setPlaying, setLoading, animateError, animateInteraction, render }

/** draws a filled circle with given parameters to the middle of the canvas */
function drawBall(htmlColor: string, radius: number) {
    context.fillStyle = htmlColor;
    context.beginPath();
    context.arc(2 * quarter, 2 * quarter, radius, 0, 2 * Math.PI);
    context.fill();
}

/** draws a non-filled circle with given parameters to the middle of the canvas
* @param o.htmlColor color
* @param o.width width
* @param o.r radius*/
function drawRing(htmlColor: string, radius: number, width: number) {
    context.lineWidth = width;
    context.strokeStyle = htmlColor;
    context.beginPath();
    context.arc(2 * quarter, 2 * quarter, radius, 0, 2 * Math.PI);
    context.stroke();
}

/** @return a html compatible color string from given parameters
 * @param o rgba object*/
function htmlColor(rgba: RGBA) {
    if (!rgba) return "rgba(0,0,0,0)";

    var r = Math.round(rgba.r * 255);
    var g = Math.round(rgba.g * 255);
    var b = Math.round(rgba.b * 255);
    var a = rgba.a;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

/** draws the icon with given colors */
function renderIcon(icon: Icon) {
    drawBall(htmlColor(icon.outerFill), quarter * 2 * 0.9);
    drawRing(htmlColor(icon.outerRing), quarter * 2 * 0.9, size / 16);

    drawBall(htmlColor(icon.innerFill), quarter * 0.9);
    drawRing(htmlColor(icon.innerRing), quarter * 0.9, size / 16);

    renderedIcon = icon;
}

/** @return the icon to be drawn at @param millis */
function iconAt(millis: number) {
    if (!animation) return renderedIcon;
    if (millis < animation.start) return renderedIcon;

    var start = animation.start;
    for (var i = 0; i < animation.transitions.length; ++i) {
        var transition = animation.transitions[i];
        if (start + transition.length > millis) {
            // we found the transition to use, it starts at "start" and ends at "start + transition.length"
            var w1 = transition.length - (millis - start);
            var w2 = millis - start;
            return {
                innerFill: RGBA.mix(transition.from.innerFill, transition.to.innerFill, w1, w2),
                innerRing: RGBA.mix(transition.from.innerRing, transition.to.innerRing, w1, w2),
                outerFill: RGBA.mix(transition.from.outerFill, transition.to.outerFill, w1, w2),
                outerRing: RGBA.mix(transition.from.outerRing, transition.to.outerRing, w1, w2),
            }
        }
        start += transition.length;
    }
    return targetIcon;
}
