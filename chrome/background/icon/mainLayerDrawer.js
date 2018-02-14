import * as RGBA from "./RGBA";

function setCanvas(canvas) {
    context = canvas.getContext("2d");
    size = canvas.width;
    quarter = size/4;
}

function setOn() {
    targetIcon = turnedOnIcon;
    animation = {start: Date.now(),transitions: [{from:renderedIcon,to:turnedOnIcon,length:300}]};
}

function setOff() {
    targetIcon = turnedOffIcon;
    animation = {start: Date.now(),transitions: [{from:renderedIcon,to:turnedOffIcon,length:300}]};
}

function setError() {
    targetIcon = errorIcon;
    animation = {start: Date.now(),transitions: [{from:renderedIcon,to:turnedOffIcon,length:300}]};
}

function setPlaying() {
    targetIcon = playingIcon;
    animation = {start: Date.now(),transitions: [{from:renderedIcon,to:playingIcon,length:300}]};
}

function setLoading() {
    targetIcon = loadingIcon;
    animation = {start: Date.now(),transitions: [{from:renderedIcon,to:loadingIcon,length:300}]};
}

function animateError() {
    animation = {start: Date.now(),transitions: [
        {from:renderedIcon,to:errorAnimationIcon,length:200},
        {from:errorAnimationIcon,to:errorIcon,length:200},
        {from:errorIcon,to:errorAnimationIcon,length:200},
        {from:errorAnimationIcon,to:errorIcon,length:200},
        {from:errorIcon,to:errorAnimationIcon,length:200},
        {from:errorAnimationIcon,to:targetIcon,length:200},
    ]};
}

function animateInteraction() {
    animation = {start: Date.now(),transitions: [
        {from:renderedIcon,to:interactionAnimationIcon,length:200},
        {from:interactionAnimationIcon,to:targetIcon,length:200},
    ]};
}

/** @param millis the time at when the animation is rendered
 * @return true if animation has finished*/
function render(millis) {
    var icon = iconAt(millis);
    renderIcon(icon);
    return icon == targetIcon;
}

export { setCanvas, setOn, setOff, setError, setPlaying, setLoading, animateError, animateInteraction, render }

const turnedOffIcon = {
    innerFill: RGBA.create({a:0.5}),    //grey
    innerRing: RGBA.BLACK,
    outerFill: RGBA.TRANSPARENT,
    outerRing: RGBA.BLACK,
}

const turnedOnIcon = {
    innerFill: RGBA.create({g:1}),
    innerRing: RGBA.BLACK,
    outerFill: RGBA.TRANSPARENT,
    outerRing: RGBA.create({r:0.2,g:0.2,b:0.2}),
}

const playingIcon = {
    innerFill: RGBA.create({b:1}),
    innerRing: RGBA.BLACK,
    outerFill: RGBA.create({b:1,a:0.5}),
    outerRing: RGBA.create({b:0.5}),
}

const errorIcon = {
    innerFill: RGBA.create({r:1}),
    innerRing: RGBA.BLACK,
    outerFill: RGBA.TRANSPARENT,
    outerRing: RGBA.BLACK,
}

const errorAnimationIcon = {
    innerFill: RGBA.create({r:1}),
    innerRing: RGBA.BLACK,
    outerFill: RGBA.create({r:1}),
    outerRing: RGBA.BLACK,
}

const loadingIcon  = {
    innerFill: RGBA.TRANSPARENT,
    innerRing: RGBA.create({a:0.2}),    //grey
    outerFill: RGBA.TRANSPARENT,
    outerRing: RGBA.TRANSPARENT,
}

const interactionAnimationIcon  = {
    innerFill: RGBA.create({g:0.7}),
    innerRing: RGBA.BLACK,
    outerFill: RGBA.create({g:0.7}),
    outerRing: RGBA.create({r:0.2,g:0.2,b:0.2}),
}

var context;
var size;
var quarter;    //should be size/4

var renderedIcon = turnedOffIcon;    //stores the last drawn state
var targetIcon = turnedOffIcon;    //in case an animation request comes in while animating, this icon is will be the end
var animation;    //current/last-finished animation

/** draws a filled circle with given parameters to the middle of the canvas */
function drawBall(htmlColor, radius) {
    context.fillStyle = htmlColor;
    context.beginPath();
    context.arc(2*quarter, 2*quarter, radius, 0, 2*Math.PI);
    context.fill();
}

/** draws a non-filled circle with given parameters to the middle of the canvas
* @param o.htmlColor color
* @param o.width width
* @param o.r radius*/
function drawRing(htmlColor, radius, width) {
    context.lineWidth = width;
    context.strokeStyle = htmlColor;
    context.beginPath();
    context.arc(2*quarter, 2*quarter, radius, 0, 2*Math.PI);
    context.stroke();
}

/** @return a html compatible color string from given parameters
 * @param o rgba object*/
function htmlColor(rgba) {
    if(!rgba) return "rgba(0,0,0,0)";

    var r = Math.round(rgba.r*255);
    var g = Math.round(rgba.g*255);
    var b = Math.round(rgba.b*255);
    var a = rgba.a;
    return "rgba("+r+","+g+","+b+","+a+")";
}

/** draws the icon with given colors */
function renderIcon(icon) {
    drawBall(htmlColor(icon.outerFill), quarter*2*0.9);
    drawRing(htmlColor(icon.outerRing), quarter*2*0.9, size/16);

    drawBall(htmlColor(icon.innerFill), quarter*0.9);
    drawRing(htmlColor(icon.innerRing), quarter*0.9, size/16);

    renderedIcon = icon;
}

/** @return the icon to be drawn at @param millis */
function iconAt(millis) {
    if(! animation) return renderedIcon;
    if(millis < animation.start) return renderedIcon;

    var start = animation.start;
    for(var i=0; i<animation.transitions.length; ++i) {
        var transition = animation.transitions[i];
        if(start + transition.length > millis) {
            //we found the transition to use, it starts at "start" and ends at "start + transition.length"
            var w1 = transition.length - (millis-start);
            var w2 = millis - start;
            return {
                innerFill:RGBA.mix(transition.from.innerFill, transition.to.innerFill,w1,w2),
                innerRing:RGBA.mix(transition.from.innerRing, transition.to.innerRing,w1,w2),
                outerFill:RGBA.mix(transition.from.outerFill, transition.to.outerFill,w1,w2),
                outerRing:RGBA.mix(transition.from.outerRing, transition.to.outerRing,w1,w2),
            }
        }
        start += transition.length;
    }
    return targetIcon;
}
