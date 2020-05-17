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

// ===================================== incoming messages =====================================

const ports = new Set<chrome.runtime.Port>();
chrome.runtime.onConnect.addListener(port => port.onMessage.addListener(message => {
    ports.add(port);
    port.onDisconnect.addListener(() => ports.delete(port));
    switch(message.action) {
        case "getVoices":          sendVoices(port); break;
        case "getSettings":        sendSettings(port); break;
        case "read":               read(port, message.text, message.source); break;
        case "arrowPressed":       popSound(); break;
        case "sendAnalytics":      scheduleAnalytics(message.analytics.category, message.analytics.action, message.analytics.label); break;
        case "getDisabledVoices":  sendDisabledVoices(port); break;
        default: console.log("unkown action " + message.action);
    }
}));

async function sendVoices(port) {
    const speechVoices = await getSortedVoices();
    const voices = speechVoices.map(speechVoice => ({name: speechVoice.name, lan: speechVoice.lang}));
    port.postMessage({ action:"updateVoices", voices });
}
function sendSettings(port) {
    chrome.storage.local.get(null, settings => port.postMessage({ action:"updateSettings", settings }));
};

const speechRequests = new Map<string,Request>();
async function read(port: chrome.runtime.Port, text: string, source: string) {
    const empty = isEmpty(text);
    if(speechRequests.size) {
        speechSynthesis.cancel();   // clean content script request
        empty && scheduleAnalytics('tts', 'stop', source);
    }

    if(empty) {
        port.postMessage({action:"ttsEvent", eventType:"end"});
        iconDrawer.drawTurnedOn();
        return;
    }

    iconDrawer.drawLoading();
    const id = port.name + Date.now();
    const request = {port, text} as Request;
    speechRequests.set(id, request);

    const voicePromise = getVoice(text, getDisabledVoices());
    const settingsPromise = new Promise<any>(resolve => chrome.storage.local.get(null, resolve));
    const [voice, settings] = await Promise.all([voicePromise, settingsPromise]);
    if(!voice) {
        onNoVoice(id);
        return;
    }

    const utterance = createUtterance(id, text, voice, settings.speed);
    speechSynthesis.speak(utterance);
    scheduleAnalytics('tts', 'read', source);
};

function popSound() {
    userInteractionAudio.currentTime = 0;
    userInteractionAudio.play();
    iconDrawer.drawInteraction();
    scheduleAnalytics('interaction', 'arrow', 'press');
};

function sendDisabledVoices(port) {
    port.postMessage({action:"updateDisabledVoices", disabledVoices: getDisabledVoices()})
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
    request.port.postMessage({action:"ttsEvent", eventType:"error"});
    scheduleAnalytics('tts', 'noVoice', getDisabledVoices().length+" disabled");
    iconDrawer.drawError();
    speechRequests.delete(id);
}

function onSpeechStart(id) {
    const request = speechRequests.get(id);
    request.port.postMessage({action:"ttsEvent", eventType:"playing"});
    iconDrawer.drawPlaying();
}

function onSpeechBoundary(id: string, event: SpeechSynthesisEvent) {
    const request = speechRequests.get(id);
    const startOffset = event.charIndex;
    const endOffset = startOffset + event.charLength;
    const text = request.text.substring(startOffset, endOffset);
    request.port.postMessage({action:"ttsEvent", eventType:"playing", startOffset, endOffset, text});
}

function onSpeechEnd(id: string) {
    const request = speechRequests.get(id);
    request.port.postMessage({action:"ttsEvent", eventType:"end"});
    speechRequests.delete(id);
    if(!speechRequests.size) {
        iconDrawer.drawTurnedOn();  // no loading request
    }
}

function onSpeechError(id: string) {
    const request = speechRequests.get(id);
    request.port.postMessage({action:"ttsEvent", eventType:"error"});
    speechRequests.delete(id);
    if(!speechRequests.size) {
        iconDrawer.drawTurnedOn();  // no loading request
    }
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

chrome.storage.local.get(null, items => {
    if(settingsPopulated(items)) {
        drawIcon(items.turnedOn);
        return;
    }
    const appVersion = chrome.runtime.getManifest().version;
    console.log("persist default settings");
    scheduleAnalytics('storage','defaults', appVersion);
    populateDefaultSettings();
});

function settingsPopulated(storage) {
    return storage.hasOwnProperty("turnedOn");
}

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
    }, () => drawIcon(true));
}

chrome.storage.onChanged.addListener(changes => {
    for(var setting in changes) {
        if(setting == "turnedOn") {
            handleOnOffEvent(changes.turnedOn.newValue);
        }
        if(changes[setting].oldValue !== undefined && changes[setting].newValue !== undefined) {
            scheduleAnalytics('storage',setting,changes[setting].newValue);    // undefined: no analytics when default or clearing
        }
    }
    chrome.storage.local.get(null, settings =>
        ports.forEach(port =>
            port.postMessage({action:"updateSettings", settings:settings})
    ));
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

function drawIcon(turnedOn) {
    if(turnedOn) iconDrawer.drawTurnedOn();
    else iconDrawer.drawTurnedOff();
}

// ===================================== others =====================================

const userInteractionAudio = new Audio("background/" + popUrl);    // TODO why "background/" needed?
userInteractionAudio.volume = 0.5;

// initial content script injection - so no Chrome restart is needed after installation
chrome.tabs.query({}, tabs => tabs
    .map(tab => tab.id)
    .forEach(id => chrome.tabs.executeScript(id, {file: 'content/content.js'}, () => chrome.runtime.lastError))
);
