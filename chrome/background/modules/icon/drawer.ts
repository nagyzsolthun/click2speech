import * as mainLayerDrawer from "./mainLayerDrawer";
import * as loadingLayerDrawer from "./loadingLayerDrawer";
import * as pointerLayerDrawer from "./pointerLayerDrawer";

type Method = () => void;

var canvas: OffscreenCanvas;
var animationEnabled: boolean;
var animating: boolean;
var onRenderFinished: Method = () => { };

function setOnRenderFinished(callback: Method) {
    onRenderFinished = callback;
}
function setCanvas(canv: OffscreenCanvas) {
    canvas = canv;
    mainLayerDrawer.setCanvas(canvas);
    loadingLayerDrawer.setCanvas(canvas);
    pointerLayerDrawer.setCanvas(canvas);
}
function setAnimationEnabled(enabled: boolean) {
    animationEnabled = enabled;
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

export { setOnRenderFinished, setCanvas, setAnimationEnabled, drawTurnedOn, drawTurnedOff, drawPlaying, drawLoading, drawError, drawInteraction }

function animate() {
    if(animationEnabled) {
        animating || renderAnimating();
    } else {
        renderFixed();
    }
}

// calls render() on each layer, repeats until all layers finsihed animation
function renderAnimating() {
    animating = true;
    canvas.width = canvas.width;
    var now = Date.now();
    var mainLayerFinished = mainLayerDrawer.render(now);
    var loadingLayerFinished = loadingLayerDrawer.render(now);
    var pointerLayerFinished = pointerLayerDrawer.render(now);
    var allLayersFinished = mainLayerFinished && loadingLayerFinished && pointerLayerFinished;
    if (allLayersFinished) {
        animating = false;
    } else {
        window.setTimeout(() => renderAnimating(), 10);
    }
    onRenderFinished();
}

function renderFixed() {
    canvas.width = canvas.width;
    var later = Date.now() + 120000;    // 2 minites from now
    mainLayerDrawer.render(later);

    // hacky way to draw full circle instead of rotating ring
    loadingLayerDrawer.render(later + 0);
    loadingLayerDrawer.render(later + 100);
    loadingLayerDrawer.render(later + 200);
    loadingLayerDrawer.render(later + 300);
    loadingLayerDrawer.render(later + 400);

    pointerLayerDrawer.render(later);
    onRenderFinished();
}