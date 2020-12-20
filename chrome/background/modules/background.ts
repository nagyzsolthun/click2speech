import { browser, Runtime } from "webextension-polyfill-ts"
import { scheduleAnalytics } from "./analytics.js";
import { getVoice, getDefaultVoiceName, getSortedVoices } from "./tts/VoiceSelector";
import * as iconDrawer from "./icon/drawer";
import popUrl from "./pop.wav"

interface SpeechRequest {
    id: string,
    text: string,
    source: string,
}

// ===================================== incoming messages =====================================

browser.runtime.onMessage.addListener(async (message, _,) => {
    const {listener, data} = calcMessageListener(messageListeners, message);
    if(!listener) {
        throw new Error("no listener for " + message);
    }
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
messageListeners.analytics = async (analytics) => {
    const { category, action, label } = analytics;
    requestAnalytics(category, action, label);
}
messageListeners.getDisabledVoices = async () => getDisabledVoices();
messageListeners.getBrowserName = () => getBrowserName();
messageListeners.arrowPressed = async () => {
    userInteractionAudio.currentTime = 0;
    userInteractionAudio.play();
    iconDrawer.drawInteraction();
    requestAnalytics('interaction', 'arrow', 'press');
};

// ===================================== content port =====================================

const contentPorts = new Set<Runtime.Port>();
const speechRequests = new Map<string, SpeechRequest>();
const speechRequestPorts = new Map<string, Runtime.Port>();
const cancelRequests = new Set<string>();

browser.runtime.onConnect.addListener(async port => {
    contentPorts.add(port);

    // assuming all contentPort message SpeechRequest
    port.onMessage.addListener(request => onSpeechRequest(port, request));
    port.onDisconnect.addListener(() => onPortClose(port));

    const settings = await getSettings();
    port.postMessage({settings});
});

async function onSpeechRequest(port: Runtime.Port, request: SpeechRequest) {
    speechRequests.forEach((_,id) => cancelRequests.add(id));
    speechRequests.set(request.id, request);
    speechRequestPorts.set(request.id, port);
    if(speechRequests.size > 1) {
        speechSynthesis.cancel();   // chain reaction will reach this request
    } else {
        processRequest(request.id);
    }

    if(cancelRequests.size && isEmpty(request.text)) {
        requestAnalytics("tts", "stop", request.source);
    }
};

function onPortClose(port: Runtime.Port) {
    contentPorts.delete(port);
    const portRequests = Array.from(speechRequestPorts.entries())
        .filter(([id,p]) => p === port)
        .map(([id,p]) => id);
    portRequests.forEach(id => cancelRequests.add(id));
    portRequests.forEach(id => speechRequestPorts.delete(id));

    const activeRequest = speechRequests.keys().next().value;
    if(portRequests.includes(activeRequest)) {
        speechSynthesis.cancel();
    }
}

// assuming no active speech when called
async function processRequest(id: string) {
    if(cancelRequests.has(id)) {
        onSpeechEnd(id);
        return;
    }

    const {text, source} = speechRequests.get(id);
    const empty = isEmpty(text);
    if(empty) {
        onSpeechEnd(id);
        return;
    }

    iconDrawer.drawLoading();
    const voice = await getVoice(text, getDisabledVoices());
    if(!voice) {
        onNoVoice(id);
        return;
    }

    const speed = await getSetting("speed");
    const utterance = createUtterance(id, text, voice, speed);
    speechSynthesis.speak(utterance);
    requestAnalytics('tts', 'read', source);
}

function isEmpty(text) {
    if(!text) return true;
    if(! /\S/.test(text)) return true;    // contains only whitespace
    return false;
}

function createUtterance(id: string, text: string, voice: SpeechSynthesisVoice, speed: number) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = speed;
    utterance.addEventListener("start",    () => onSpeechStart(id));
    utterance.addEventListener("end",      () => onSpeechEnd(id));
    utterance.addEventListener("error",    () => onSpeechError(id, voice.name));
    utterance.addEventListener("boundary", event => onSpeechBoundary(id, event));
    if(voice.name.includes("Google")) {
        applyGoogleVoiceWorkaround(utterance)
    }
    return utterance;
}

function onNoVoice(id: string) {
    postContentMessage(id, {speechError: id});
    onSpeechTermination(id, true);
    requestAnalytics('tts', 'noVoice', getDisabledVoices().length+" disabled");
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

function onSpeechError(id: string, voiceName: string) {
    disableVoice(voiceName);
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
    cancelRequests.delete(id);
    speechRequests.delete(id);
    speechRequestPorts.delete(id);

    const nextId = speechRequests.keys().next().value;
    if(nextId) {
        processRequest(nextId);
        return;
    }

    const turnedOn = await getSetting("turnedOn");
    drawIcon(turnedOn, error);
}

// ===================================== disabled voices =====================================
const voiceNameToErrorTime = {};
const voiceNameToEnable = {};
function disableVoice(voiceName) {
    voiceNameToErrorTime[voiceName] = Date.now();

    var enableId = voiceNameToEnable[voiceName];
    if(enableId) clearTimeout(enableId);

    enableId = setTimeout(() => {
        delete voiceNameToErrorTime[voiceName];
        delete voiceNameToEnable[voiceName];
    }, 5*60*1000);    // 5 minutes
    voiceNameToEnable[voiceName] = enableId;

    requestAnalytics('tts', 'error', voiceName);
}

function getDisabledVoices() {
    return Object.keys(voiceNameToErrorTime);
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

getSetting("turnedOn").then(turnedOn => {
    if(turnedOn !== undefined) {
        drawIcon(turnedOn);
        populatAnalyticsFlag();
        return;
    }
    console.log("persist default settings");
    populateDefaultSettings();
    
    const appVersion = browser.runtime.getManifest().version;
    scheduleAnalytics('storage','defaults', appVersion);
})

// temporary function to add analytics flag for old versions
async function populatAnalyticsFlag() {
    const analytics = await getSetting("analytics");
    if(analytics === undefined) {
        console.log("persist analytics flag");
        browser.storage.local.set({analytics: true});
        scheduleAnalytics('storage', 'analytics', 'default');
    }
}

async function populateDefaultSettings() {
    const defaultVoiceName = await getDefaultVoiceName();
    requestAnalytics('storage','defaultVoice', defaultVoiceName);
    await browser.storage.local.set({
        turnedOn: true,
        preferredVoice: defaultVoiceName,
        speed: 1.2,
        hoverSelect: true,
        arrowSelect: false,
        browserSelect: false,
        analytics: true
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

browser.storage.onChanged.addListener(async changes => {
    for(var setting in changes) {
        if(setting == "turnedOn") {
            handleOnOffEvent(changes.turnedOn.newValue);
        }
        if(setting === "analytics" && changes[setting].newValue === false) {
            scheduleAnalytics('storage', 'analytics', false);   // otherwise already blocked
        }
        if(changes[setting].oldValue !== undefined && changes[setting].newValue !== undefined) {
            requestAnalytics('storage',setting,changes[setting].newValue);    // undefined: no analytics when default or clearing
        }
    }
    const settings = await getSettings();
    contentPorts.forEach(port => port.postMessage({ settings }));
});

function handleOnOffEvent(turnedOn) {
    if(turnedOn) {
        iconDrawer.drawTurnedOn()
    } else {
        speechSynthesis.cancel();
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
iconDrawer.setCanvas(iconCanvas);
iconDrawer.setOnRenderFinished(loadIconToToolbar);

// iconDrawer draws the icon on a canvas, this function shows the canvas on the toolbar
function loadIconToToolbar() {
    browser.browserAction.setIcon({imageData:iconCanvas.getContext("2d").getImageData(0, 0, iconCanvas.width, iconCanvas.height)});
}

// ===================================== others =====================================

async function requestAnalytics(category: string, action: string, label: string) {
    const anayltics = await getSetting("analytics");
    if(anayltics) {
        scheduleAnalytics(category, action, label);
    }
}

const userInteractionAudio = new Audio(popUrl);
userInteractionAudio.volume = 0.5;

// initial content script injection - so no Chrome restart is needed after installation
browser.tabs.query({}).then(tabs => tabs
    .map(tab => tab.id)
    .map(id => browser.tabs.executeScript(id, {file: 'content/content.js'})
    .catch(e => console.log(e.message)))    // local html and extension settings throw some errors
);
