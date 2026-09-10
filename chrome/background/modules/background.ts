import { Runtime } from "webextension-polyfill";
import { browser, keepSpeechAlive } from "./platform";
import { getVoice, getDefaultVoiceName, getSortedVoices } from "./tts/VoiceSelector";
import * as iconDrawer from "./icon/drawer";
import popUrl from "./pop.wav"

interface SpeechRequest {
    id: string,
    text: string
}

// ===================================== incoming messages =====================================

browser.runtime.onMessage.addListener(async message => {
    const {listener, data} = calcMessageListener(messageListeners, message);
    if(!listener) {
        throw new Error("no listener for " + message);
    }
    await settingsReady;
    const response = await listener(data);
    return response;
});

// messages can be simple strings, or listener:data objects
function calcMessageListener<D,R>(
    listeners: { [key: string]: (data?: D) => R },
    message: string | object):
        { listener: (data?: D) => R, data?: D } {

    // string message
    if(typeof message === "string") {
        const listener = listeners[message];
        return { listener };
    }

    // listener:data message - take the value from the message and return it as data
    const keys = Object.keys(message);
    if(keys.length != 1) {
        throw new Error("message must be string or contain one key");
    }
    const key = keys[0];
    const listener = listeners[key];
    const data = message[key];
    return { listener, data }
}

const messageListeners: { [key: string]: (message?: any) => Promise<any> } = {};
messageListeners.getVoices = async () => {
    const speechVoices = await getSortedVoices();
    return speechVoices.map(speechVoice => ({name: speechVoice.name, lan: speechVoice.lang}));
}
messageListeners.getDisabledVoices = async () => getDisabledVoices();
messageListeners.getBrowserName = () => getBrowserName();
messageListeners.arrowPressed = async () => {
    userInteractionAudio.currentTime = 0;
    await userInteractionAudio.play();
    iconDrawer.drawInteraction();
};

// ===================================== content port =====================================

const contentPorts = new Set<Runtime.Port>();
const speechRequests = new Map<string, SpeechRequest>();
const speechRequestPorts = new Map<string, Runtime.Port>();
let speechHeartbeat: ReturnType<typeof setInterval>;

browser.runtime.onConnect.addListener(async port => {
    contentPorts.add(port);
    port.onMessage.addListener(request => {
        void settingsReady.then(() => {
            if (contentPorts.has(port)) return onSpeechRequest(port, request as SpeechRequest);
        });
    });
    port.onDisconnect.addListener(() => onPortClose(port));
    await settingsReady;
    const settings = await getSettings();
    if (contentPorts.has(port)) port.postMessage({settings});
});

function stopRequests() {
    speechSynthesis.cancel();
    // Some engines don't report cancellation before an utterance starts.
    for (const id of Array.from(speechRequests.keys())) onSpeechEnd(id);
}

async function onSpeechRequest(port: Runtime.Port, request: SpeechRequest) {
    if (!request || typeof request.text !== "string") return;
    stopRequests();
    speechRequests.set(request.id, request);
    speechRequestPorts.set(request.id, port);
    if (!speechHeartbeat) {
        speechHeartbeat = setInterval(() => { void keepSpeechAlive(); }, 20000);
    }
    try {
        await processRequest(request.id);
    } catch (error) {
        if (speechRequests.get(request.id) === request) onNoVoice(request.id);
        console.error(error);
    }
}

function onPortClose(port: Runtime.Port) {
    contentPorts.delete(port);
    const active = Array.from(speechRequestPorts.values()).includes(port);
    for (const [id, requestPort] of speechRequestPorts) {
        if (requestPort === port) speechRequestPorts.delete(id);
    }
    if (active) stopRequests();
}

async function processRequest(id: string) {
    const request = speechRequests.get(id);
    if(isEmpty(request.text)) {
        onSpeechEnd(id);
        return;
    }
    iconDrawer.drawLoading();
    const [voice, speed, turnedOn] = await Promise.all([
        getVoice(request.text, await getDisabledVoices()), getSetting("speed"), getSetting("turnedOn")
    ]);
    // Cancellation can happen while voices, language or settings are loading.
    if (speechRequests.get(id) !== request) return;
    if (!turnedOn) { onSpeechEnd(id); return; }
    if (!voice) { onNoVoice(id); return; }
    const utterance = createUtterance(id, request.text, voice, speed);
    speechSynthesis.speak(utterance);
}

function isEmpty(text) {
    if(!text) return true;
    if(! /\S/.test(text)) return true;    // contains only whitespace
    return false;
}

function createUtterance(id: string, text: string, voice: SpeechSynthesisVoice, speed: number) {
    const utterance = new SpeechSynthesisUtterance(text);
    const request = speechRequests.get(id);
    const ifCurrent = (listener: (event: any) => void) => (event: any) => {
        if (speechRequests.get(id) === request) listener(event);
    };
    utterance.voice = voice;
    utterance.rate = speed;
    utterance.addEventListener("start",    ifCurrent(() => onSpeechStart(id)));
    utterance.addEventListener("end",      ifCurrent(() => onSpeechEnd(id)));
    utterance.addEventListener("error",    ifCurrent(event => onSpeechError(id, event)));
    utterance.addEventListener("boundary", ifCurrent(event => onSpeechBoundary(id, event)));
    if(voice.name.includes("Google")) {
        applyGoogleVoiceWorkaround(utterance)
    }
    return utterance;
}

function onNoVoice(id: string) {
    postContentMessage(id, {speechError: id});
    onSpeechTermination(id, true);
}

function onSpeechStart(id) {
    postContentMessage(id, {speechStart: id});
    iconDrawer.drawPlaying();
}

function onSpeechBoundary(id: string, event: SpeechSynthesisEvent) {
    const request = speechRequests.get(id);
    const startOffset = event.charIndex;
    const endOffset = startOffset + event.charLength;
    const text = request.text.substring(startOffset, endOffset);
    postContentMessage(id, {speechBoundary: {id, startOffset, endOffset, text}});
}

async function onSpeechEnd(id: string) {
    postContentMessage(id, {speechEnd: id});
    onSpeechTermination(id);
}

function onSpeechError(id: string, event: SpeechSynthesisErrorEvent) {
    // utterance.cancel generates interrupted error
    if(event.error === "interrupted" || event.error === "canceled") {
        onSpeechEnd(id);
        return;
    }
    disableVoice(event.utterance.voice?.name);
    postContentMessage(id, {speechError: id});
    onSpeechTermination(id, true);
}

function postContentMessage(requestId: string, message: any) {
    const port = speechRequestPorts.get(requestId);
    if(!port) {
        return; // port closed
    }
    port.postMessage(message);
}

// cleanup, schedule next, icon
async function onSpeechTermination(id: string, error?: boolean) {

    speechRequests.delete(id);
    speechRequestPorts.delete(id);

    if (speechRequests.size) return;
    clearInterval(speechHeartbeat);
    speechHeartbeat = undefined;
    clearPauseResume();

    const turnedOn = await getSetting("turnedOn");
    if (!speechRequests.size) drawIcon(turnedOn, error);
}

// ===================================== disabled voices =====================================
async function disableVoice(voiceName: string) {
    const {disabledVoices = {}} = await browser.storage.local.get("disabledVoices");
    disabledVoices[voiceName] = Date.now() + 5 * 60 * 1000;
    await browser.storage.local.set({disabledVoices});
}

async function getDisabledVoices(): Promise<string[]> {
    const {disabledVoices = {}} = await browser.storage.local.get("disabledVoices");
    return Object.keys(disabledVoices).filter(name => disabledVoices[name] > Date.now());
}

// ===================================== Google TTS bug workaround =====================================

// https://bugs.chromium.org/p/chromium/issues/detail?id=335907
var scheduledPauseResume;

function applyGoogleVoiceWorkaround(utternace: SpeechSynthesisUtterance) {
    utternace.addEventListener("start", () => startPauseResume(utternace.rate));
    utternace.addEventListener("end", clearPauseResume);
    utternace.addEventListener("error", clearPauseResume);
}

function startPauseResume(rate) {
    // pauseResume() generates noise, should be infrequent but frequent enough for for the seech to not get stuck
    const repeateInterval = 5000 / rate;
    scheduledPauseResume = scheduledPauseResume || setInterval(pauseResume, repeateInterval);
}

function clearPauseResume() {
    if(scheduledPauseResume) {
        clearInterval(scheduledPauseResume);
    }
    scheduledPauseResume = null;
}

function pauseResume() {
    speechSynthesis.pause();
    speechSynthesis.resume();
}

// ===================================== settings =====================================

const settingsReady = getSetting("turnedOn").then(turnedOn => {
    if(turnedOn !== undefined) {
        drawIcon(turnedOn);
        return removeAnalyticsFlag();
    }
    console.log("persist default settings");
    return populateDefaultSettings();
})

// temporary function to remove analytics flag for old versions
async function removeAnalyticsFlag() {
  const analytics = await getSetting("analytics");
  if(analytics !== undefined) {
      console.log("remove analytics flag");
      await browser.storage.local.remove("analytics");
  }
}

async function populateDefaultSettings() {
    const defaultVoiceName = await getDefaultVoiceName();
    await browser.storage.local.set({
        turnedOn: true,
        preferredVoice: defaultVoiceName,
        speed: 1.2,
        hoverSelect: true,
        arrowSelect: false,
        browserSelect: false
    });
    iconDrawer.drawTurnedOn();
}

async function getSetting(key: string) {
    const settings = await browser.storage.local.get(key);
    return settings[key];
}

function getSettings() {
    return browser.storage.local.get(null);
}

browser.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "local") return;
    if("turnedOn" in changes) {
      handleOnOffEvent(changes.turnedOn.newValue);
    }
    const settings = await getSettings();
    contentPorts.forEach(port => port.postMessage({ settings }));
});

function handleOnOffEvent(turnedOn) {
    if(turnedOn) {
        iconDrawer.drawTurnedOn()
    } else {
        stopRequests();
        iconDrawer.drawTurnedOff();
    }
}

// ===================================== icon =====================================

async function getBrowserName() {
    if(navigator.userAgent.includes("Firefox")) return "Firefox";
    if(navigator.userAgent.includes("Edg")) return "Edge";  // Edg must come before Chrome
    if(navigator.userAgent.includes("Chrome")) return "Chrome";
}

function drawIcon(turnedOn: boolean, error?: boolean) {
    if(!turnedOn) {
        iconDrawer.drawTurnedOff();
        return;
    }
    if(error) {
        iconDrawer.drawError();
        return
    }
    iconDrawer.drawTurnedOn();
}

getBrowserName().then(name => iconDrawer.setAnimationEnabled(name != "Firefox"));   // animation is weird in Firefox

const iconCanvas = document.createElement("canvas");
iconCanvas.width = iconCanvas.height = 32;
// Set this on the first context creation, before the drawing layers obtain it.
// Every animation frame reads pixels back to update the toolbar icon.
const iconContext = iconCanvas.getContext("2d", {willReadFrequently: true});
iconDrawer.setCanvas(iconCanvas);
iconDrawer.setOnRenderFinished(loadIconToToolbar);

// iconDrawer draws the icon on a canvas, this function shows the canvas on the toolbar
function loadIconToToolbar() {
    browser.action.setIcon({imageData:iconContext.getImageData(0, 0, iconCanvas.width, iconCanvas.height)});
}

// ===================================== others =====================================

const userInteractionAudio = new Audio(popUrl);
userInteractionAudio.volume = 0.5;
