/// <reference types="chrome"/>

import { scheduleAnalytics } from "./analytics.js";
import { getVoice, getDefaultVoiceName, getSortedVoices } from "./tts/VoiceSelector";
import * as iconDrawer from "./icon/drawer";
import popUrl from "./pop.wav"

interface Request {
    port: chrome.runtime.Port,
    text: string,
    utterance?: SpeechSynthesisUtterance
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

const speechRequests = new Map<string,Request>();
messageListeners.read = async (port: chrome.runtime.Port, { text, source }) => {
    const empty = isEmpty(text);
    if(speechRequests.size) {
        speechSynthesis.cancel();   // clean content script request
        empty && scheduleAnalytics('tts', 'stop', source);
    }

    if(empty) {
        port.postMessage("ttsEnd");
        const turnedOn = await getSetting("turnedOn");
        drawIcon(turnedOn);
        return;
    }

    iconDrawer.drawLoading();
    const id = port.name + Date.now();
    const request = {port, text} as Request;
    speechRequests.set(id, request);

    const voicePromise = getVoice(text, getDisabledVoices());
    const speedPromise = getSetting("speed");
    const [voice, speed] = await Promise.all([voicePromise, speedPromise]);
    if(!voice) {
        onNoVoice(id);
        return;
    }

    const utterance = createUtterance(id, text, voice, speed);
    speechSynthesis.speak(utterance);
    scheduleAnalytics('tts', 'read', source);
};

messageListeners.arrowPressed = () => {
    userInteractionAudio.currentTime = 0;
    userInteractionAudio.play();
    iconDrawer.drawInteraction();
    scheduleAnalytics('interaction', 'arrow', 'press');
};

messageListeners.analytics = (_, analytics) => {
    const { category, action, label } = analytics;
    scheduleAnalytics(category, action, label);
}

messageListeners.getDisabledVoices = (port) => {
    const disabledVoices = getDisabledVoices();
    port.postMessage({ disabledVoices })
};

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
    utterance.addEventListener("error",    () => onSpeechError(id));
    utterance.addEventListener("boundary", event => onSpeechBoundary(id, event));
    if(voice.name.includes("Google")) {
        applyGoogleVoiceWorkaround(utterance)
    }
    speechRequests.get(id).utterance = utterance;
    return utterance;
}

function onNoVoice(id: string) {
    const request = speechRequests.get(id);
    request.port.postMessage("ttsError");
    scheduleAnalytics('tts', 'noVoice', getDisabledVoices().length+" disabled");
    iconDrawer.drawError();
    speechRequests.delete(id);
}

function onSpeechStart(id) {
    const request = speechRequests.get(id);
    request.port.postMessage("ttsPlaying");
    iconDrawer.drawPlaying();
}

function onSpeechBoundary(id: string, event: SpeechSynthesisEvent) {
    const request = speechRequests.get(id);
    const startOffset = event.charIndex;
    const endOffset = startOffset + event.charLength;
    const text = request.text.substring(startOffset, endOffset);
    request.port.postMessage({ttsPlaying: {startOffset, endOffset, text}});
}

async function onSpeechEnd(id: string) {
    const request = speechRequests.get(id);
    request.port.postMessage("ttsEnd");
    speechRequests.delete(id);
    if(!speechRequests.size) {  // no loading request
        const turnedOn = await getSetting("turnedOn");
        drawIcon(turnedOn);
    }
}

function onSpeechError(id: string) {
    const request = speechRequests.get(id);
    request.port.postMessage("ttsError");
    speechRequests.delete(id);
    iconDrawer.drawError();
    errorVoice(request.utterance.voice.name);
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

    scheduleAnalytics('tts', 'error', voiceName);
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
        return;
    }
    const appVersion = chrome.runtime.getManifest().version;
    console.log("persist default settings");
    scheduleAnalytics('storage','defaults', appVersion);
    populateDefaultSettings();
})

async function populateDefaultSettings() {
    const defaultVoiceName = await getDefaultVoiceName();
    scheduleAnalytics('storage','defaultVoice', defaultVoiceName);
    chrome.storage.local.set({
        turnedOn: true,
        preferredVoice: defaultVoiceName,
        speed: 1.2,
        hoverSelect: true,
        arrowSelect: false,
        browserSelect: false,
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
        if(changes[setting].oldValue !== undefined && changes[setting].newValue !== undefined) {
            scheduleAnalytics('storage',setting,changes[setting].newValue);    // undefined: no analytics when default or clearing
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

function drawIcon(turnedOn: boolean) {
    turnedOn ? iconDrawer.drawTurnedOn() : iconDrawer.drawTurnedOff();
}

// hack to check which browser is active
const getBrowserInfo = (window as any).browser?.runtime?.getBrowserInfo;  // this method is only available in Firefox
const browserName = getBrowserInfo ? getBrowserInfo().then(info => info.name) : Promise.resolve("Chrome");
browserName.then(name => iconDrawer.setAnimationEnabled(name.includes("Chrome")));  // Firefox does not support icon animation (it looks weird)

var iconCanvas = document.createElement("canvas");
iconCanvas.width = iconCanvas.height = 32;
iconDrawer.setCanvas(iconCanvas);
iconDrawer.setOnRenderFinished(loadIconToToolbar);

// iconDrawer draws the icon on a canvas, this function shows the canvas on the toolbar
function loadIconToToolbar() {
    chrome.browserAction.setIcon({imageData:iconCanvas.getContext("2d").getImageData(0, 0, iconCanvas.width, iconCanvas.height)});
}

// ===================================== others =====================================

const userInteractionAudio = new Audio("background/" + popUrl);    // TODO why "background/" needed?
userInteractionAudio.volume = 0.5;

// initial content script injection - so no Chrome restart is needed after installation
chrome.tabs.query({}, tabs => tabs
    .map(tab => tab.id)
    .forEach(id => chrome.tabs.executeScript(id, {file: 'content/content.js'}, () => chrome.runtime.lastError))
);
