import * as mainLayerDrawer from "./mainLayerDrawer";
import * as loadingLayerDrawer from "./loadingLayerDrawer";
import * as pointerLayerDrawer from "./pointerLayerDrawer";

var onRenderFinished;
function setOnRenderFinished(callback) {
    onRenderFinished = callback;
}
function setCanvas(canv) {
    canvas = canv;
    mainLayerDrawer.setCanvas(canvas);
    loadingLayerDrawer.setCanvas(canvas);
    pointerLayerDrawer.setCanvas(canvas);
}
function drawTurnedOn() {
    mainLayerDrawer.setOn();
    loadingLayerDrawer.setOff();
    pointerLayerDrawer.setOn();
    animate();
}
function drawTurnedOff() {
    mainLayerDrawer.setOff();
    loadingLayerDrawer.setOff();
    pointerLayerDrawer.setOn();
    animate();
}
function drawPlaying() {
    mainLayerDrawer.setPlaying();
    loadingLayerDrawer.setOff();
    pointerLayerDrawer.setOn();
    animate();
}
function drawLoading() {
    mainLayerDrawer.setLoading();
    loadingLayerDrawer.setOn();
    pointerLayerDrawer.setOff();
    animate();
}
function drawError() {
    loadingLayerDrawer.setOff();
    mainLayerDrawer.setError();
    mainLayerDrawer.animateError();
    pointerLayerDrawer.setOn();
    animate();
}
function drawInteraction() {
    mainLayerDrawer.animateInteraction();
    animate();
}

export { setOnRenderFinished, setCanvas, drawTurnedOn, drawTurnedOff, drawPlaying, drawLoading, drawError, drawInteraction }

var canvas;
var animating = false;
var onRenderFinished = () => {};

// calls render() on each layer, repeats until all layers finsihed animation
function render() {
    animating = true;
    canvas.width = canvas.width;
    var now = Date.now();
    var mainLayerFinished = mainLayerDrawer.render(now);
    var loadingLayerFinished = loadingLayerDrawer.render(now);
    var pointerLayerFinished = pointerLayerDrawer.render(now);
    var allLayersFinished = mainLayerFinished && loadingLayerFinished && pointerLayerFinished;
    if(allLayersFinished) {
        animating = false;
    } else {
        window.setTimeout(() => render(), 10);
    }
    onRenderFinished();
}

// starts iteration of rendering - if not already started
function animate() {
    if(!animating) render();
}
