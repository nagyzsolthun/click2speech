/// <reference types="chrome"/>

import { scheduleAnalytics } from "./analytics.js";
import { getVoice, getDefaultVoiceName, getSortedVoices } from "./tts/VoiceSelector";
import * as iconDrawer from "./icon/drawer";
import popUrl from "./pop.wav"

interface Request {
    id: string,
    text: string,
    source: string,
}

type MessageListener = (port: chrome.runtime.Port, data?: any) => any

// ===================================== incoming messages =====================================

const ports = new Set<chrome.runtime.Port>();
const messageListeners: { [key: string]: MessageListener } = {};
chrome.runtime.onConnect.addListener(port => {
    ports.add(port);
    port.onDisconnect.addListener(() => ports.delete(port));
    port.onMessage.addListener(message => {
        if(typeof message === "string") {
            const listener = messageListeners[message];
            listener && listener(port);
            return;
        }
        Object.keys(message).forEach(key => {
            const listener = messageListeners[key];
            listener && listener(port, message[key]);
        });
    });
});

messageListeners.getVoices = async (port) => {
    const speechVoices = await getSortedVoices();
    const voices = speechVoices.map(speechVoice => ({name: speechVoice.name, lan: speechVoice.lang}));
    port.postMessage({ voices });
}

messageListeners.getSettings = async (port) => {
    const settings = await getSettings();
    port.postMessage({ settings });
};

const speechRequests = new Map<string, Request>();
const speechRequestPorts = new Map<string, chrome.runtime.Port>();
messageListeners.read = async (port: chrome.runtime.Port, request: Request) => {
    speechSynthesis.cancel();
    speechRequests.set(request.id, request);
    speechRequestPorts.set(request.id, port);
    if(speechRequests.size == 1) {
        // end|error will schedule processRequest
        // otherwise parallel requests may mess up speech events (e.g. FF double-triple clicks)
        setTimeout(processLastRequest);
    }

    // stop analytics
    if(speechRequests.size > 1 && isEmpty(request.text)) {
        requestAnalytics("tts", "stop", request.source);
    }
};

messageListeners.arrowPressed = () => {
    userInteractionAudio.currentTime = 0;
    userInteractionAudio.play();
    iconDrawer.drawInteraction();
    requestAnalytics('interaction', 'arrow', 'press');
};

messageListeners.analytics = (_, analytics) => {
    const { category, action, label } = analytics;
    requestAnalytics(category, action, label);
}

messageListeners.getDisabledVoices = (port) => {
    const disabledVoices = getDisabledVoices();
    port.postMessage({ disabledVoices })
};

messageListeners.getBrowserName = async (port) => {
    const browserName = await getBrowserName();
    port.postMessage({ browserName });
}

// assume no active speech when called
async function processLastRequest() {
    const ids = Array.from(speechRequests.keys());
    const id = ids.pop();
    ids.forEach(cancelSpeech);  // several request at once (e.g. double-triple clicks in FF)

    const {text, source} = speechRequests.get(id);
    const port = speechRequestPorts.get(id);

    const empty = isEmpty(text);
    if(empty) {
        port.postMessage({speechEnd: id});
        onSpeechTermination(id);
        return;
    }

    iconDrawer.drawLoading();
    const voicePromise = getVoice(text, getDisabledVoices());
    const speedPromise = getSetting("speed");
    const [voice, speed] = await Promise.all([voicePromise, speedPromise]);
    if(!voice) {
        onNoVoice(id);
        return;
    }

    const utterance = createUtterance(id, text, voice, speed);
    speechSynthesis.speak(utterance);
    requestAnalytics('tts', 'read', source);
}

// assume no active speech, sends end event and cleans
function cancelSpeech(id: string) {
    const port = speechRequestPorts.get(id);
    port.postMessage({speechEnd: id});
    cleanRequest(id);
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
    const port = speechRequestPorts.get(id);
    port.postMessage({speechError: id});
    onSpeechTermination(id, true);
    requestAnalytics('tts', 'noVoice', getDisabledVoices().length+" disabled");
}

function onSpeechStart(id) {
    const port = speechRequestPorts.get(id);
    port.postMessage({speechStart: id});
    iconDrawer.drawPlaying();
}

function onSpeechBoundary(id: string, event: SpeechSynthesisEvent) {
    const request = speechRequests.get(id);
    const startOffset = event.charIndex;
    const endOffset = startOffset + event.charLength;
    const text = request.text.substring(startOffset, endOffset);

    const port = speechRequestPorts.get(id);
    port.postMessage({speechBoundary: {id, startOffset, endOffset, text}});
}

async function onSpeechEnd(id: string) {
    const port = speechRequestPorts.get(id);
    port.postMessage({speechEnd: id});
    onSpeechTermination(id);
}

function onSpeechError(id: string, voiceName: string) {
    const port = speechRequestPorts.get(id);
    port.postMessage({speechError: id});
    onSpeechTermination(id, true);
    errorVoice(voiceName);
}

// cleanup, schedule, icon
async function onSpeechTermination(id: string, error?: boolean) {
    cleanRequest(id);
    if(speechRequests.size) {
        setTimeout(processLastRequest);
        return; // no icon draw when loading animation
    }
    const turnedOn = await getSetting("turnedOn");
    drawIcon(turnedOn, error);
}

function cleanRequest(id: string) {
    speechRequests.delete(id);
    speechRequestPorts.delete(id);
}

// ===================================== disabled voices =====================================
const voiceNameToErrorTime = {};
const voiceNameToEnable = {};
function errorVoice(voiceName) {
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
    
    const appVersion = chrome.runtime.getManifest().version;
    scheduleAnalytics('storage','defaults', appVersion);
})

// temporary function to add analytics flag for old versions
async function populatAnalyticsFlag() {
    const analytics = await getSetting("analytics");
    if(analytics === undefined) {
        console.log("persist analytics flag");
        chrome.storage.local.set({analytics: true});
        scheduleAnalytics('storage', 'analytics', 'default');
    }
}

async function populateDefaultSettings() {
    const defaultVoiceName = await getDefaultVoiceName();
    requestAnalytics('storage','defaultVoice', defaultVoiceName);
    chrome.storage.local.set({
        turnedOn: true,
        preferredVoice: defaultVoiceName,
        speed: 1.2,
        hoverSelect: true,
        arrowSelect: false,
        browserSelect: false,
        analytics: true
    }, iconDrawer.drawTurnedOn);
}

async function getSetting(key: string) {
    const settings = await new Promise<any>(resolve => chrome.storage.local.get(key, resolve));
    return settings[key];
}

function getSettings() {
    return new Promise<any>(resolve => chrome.storage.local.get(null, resolve));
}

chrome.storage.onChanged.addListener(async changes => {
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
    ports.forEach(port => port.postMessage({ settings }));
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

// hack to check which browser is active
getBrowserName().then(name => iconDrawer.setAnimationEnabled(!name.includes("Firefox")));

var iconCanvas = document.createElement("canvas");
iconCanvas.width = iconCanvas.height = 32;
iconDrawer.setCanvas(iconCanvas);
iconDrawer.setOnRenderFinished(loadIconToToolbar);

// iconDrawer draws the icon on a canvas, this function shows the canvas on the toolbar
function loadIconToToolbar() {
    chrome.browserAction.setIcon({imageData:iconCanvas.getContext("2d").getImageData(0, 0, iconCanvas.width, iconCanvas.height)});
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
chrome.tabs.query({}, tabs => tabs
    .map(tab => tab.id)
    .forEach(id => chrome.tabs.executeScript(id, {file: 'content/content.js'}, () => chrome.runtime.lastError))
);
