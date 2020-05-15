/// <reference types="chrome"/>

import { scheduleAnalytics } from "./analytics.js";
import { nextSentenceEnd, nextWordEnd } from "./tts/TextSplitter.js";
import { getVoice, getDefaultVoiceName, getSortedVoices } from "./tts/VoiceSelector";
import * as iconDrawer from "./icon/drawer";
import * as ibmTts from "./tts/IbmTtsEngine.js";
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

    const action = message["action"];
    const listener = messageListeners[action];
    if(listener) {
        listener(message, port);
    };
}));

const speechRequests = new Map<string,Request>();

const messageListeners = {} as any;
messageListeners.getVoices = (message,port) => {
    const voices = getSortedVoices().map(voice => ({name: voice.name, lan: voice.lang}));
    port.postMessage({ action:"updateVoices", voices })
}
messageListeners.getSettings = (message,port) => {
    chrome.storage.local.get(null, settings => port.postMessage({ action:"updateSettings", settings }));
};
messageListeners.read = (message, port: chrome.runtime.Port) => {
    const text = message.text;
    const empty = isEmpty(text);
    if(speechRequests.size) {
        speechSynthesis.cancel();   // clean content script request
        empty && scheduleAnalytics('tts', 'stop', message.source);
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

    const settingsPromise = new Promise(resolve => chrome.storage.local.get(null, resolve));
    const voicePromise = getVoice(text, getDisabledVoices());
    Promise.all([settingsPromise,voicePromise]).then(values => {
        const settings = values[0] as any;
        const voice = values[1] as SpeechSynthesisVoice;

        const utterance = new SpeechSynthesisUtterance(text);
        request.utterance = utterance;
        
        utterance.voice = voice;
        utterance.rate = settings.speed;
        utterance.addEventListener("start",    () => onSpeechStart(id));
        utterance.addEventListener("end",      () => onSpeechEnd(id));
        utterance.addEventListener("error",    () => onSpeechError(id));
        utterance.addEventListener("boundary", event => onSpeechBoundary(id, event));

        if(voice.name.includes("Google")) {
            applyGoogleVoiceWorkaround(utterance)
        }
        speechSynthesis.speak(utterance);
    }).catch(() => {
        iconDrawer.drawError();
        port.postMessage({action:"ttsEvent", eventType:"error"});
        scheduleAnalytics('tts', 'noVoice', getDisabledVoices().length+" disabled");
    });

    // anyltics
    scheduleAnalytics('tts', 'read', message.source);
};
messageListeners.arrowPressed = (message,port) => {
    userInteractionAudio.currentTime = 0;
    userInteractionAudio.play();
    iconDrawer.drawInteraction();
    scheduleAnalytics('interaction', 'arrow', 'press');
};
messageListeners.contactInteraction = (message,port) => {
    scheduleAnalytics('interaction', 'contacts', message.interaction);
};
messageListeners.getDisabledVoices = (message,port) => {
    port.postMessage({action:"updateDisabledVoices", disabledVoices:getDisabledVoices()})
};

function isEmpty(text) {
    if(!text) return true;
    if(! /\S/.test(text)) return true;    // contains only whitespace
    return false;
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

// ===================================== error handling =====================================
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

// ===================================== outgoing messages to content =====================================
// TODO delete this all
function notifyContent(port, chromeTtsEvent, text?: string) {
    const contentNofifier = ttsEventToContentNotifier[chromeTtsEvent.type];
    if(contentNofifier) contentNofifier(port, chromeTtsEvent, text);
}

var ttsEventToContentNotifier = {} as any;
ttsEventToContentNotifier.sentence = (port,chromeTtsEvent,text) => {
    const startOffset = chromeTtsEvent.charIndex;
    const endOffset = nextSentenceEnd(text, startOffset);
    const textToSend = text.substring(startOffset,endOffset);
    port.postMessage({action:"ttsEvent", eventType:"playing", startOffset: startOffset, endOffset:endOffset, text:textToSend});
}
ttsEventToContentNotifier.word = (port,chromeTtsEvent,text) => {
    const startOffset = chromeTtsEvent.charIndex;
    const endOffset = nextWordEnd(text, startOffset);
    const textToSend = text.substring(startOffset,endOffset);
    port.postMessage({action:"ttsEvent", eventType:"playing", startOffset: startOffset, endOffset:endOffset, text:textToSend});
}
ttsEventToContentNotifier.start = port => port.postMessage({action:"ttsEvent", eventType:"playing"});
ttsEventToContentNotifier.interrupted =
ttsEventToContentNotifier.stop =
ttsEventToContentNotifier.end = port => port.postMessage({action:"ttsEvent", eventType:"end"});
ttsEventToContentNotifier.error = port => port.postMessage({action:"ttsEvent", eventType:"error"});

// ===================================== settings =====================================

chrome.storage.local.get(null, items => {
    if(settingsPopulated(items)) {
        drawIcon(items.turnedOn);
        return;
    }
    // const appVersion = (chrome as any).app.getDetails().version as string;  // TODO firefox
    const appVersion = "test"

    console.log("persist default settings");
    scheduleAnalytics('storage','defaults', appVersion);
    populateDefaultSettings();
});

function settingsPopulated(storage) {
    return storage.hasOwnProperty("turnedOn");
}

function populateDefaultSettings() {
    getDefaultVoiceName().then((voice) => {
        scheduleAnalytics('storage','defaultVoice', voice);
        chrome.storage.local.set({
            turnedOn: true,
            preferredVoice: voice,
            speed: 1.2,
            hoverSelect: true,
            arrowSelect: false,
            browserSelect: false,
        }, () => drawIcon(true));
    });
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

var iconCanvas = document.createElement("canvas");
iconCanvas.width = iconCanvas.height = 32;
iconDrawer.setCanvas(iconCanvas);
iconDrawer.setOnRenderFinished(loadIconToToolbar);

// iconDrawer draws the icon on a canvas, this function shows the canvas on the toolbar
function loadIconToToolbar() {
    chrome.browserAction.setIcon({imageData:iconCanvas.getContext("2d").getImageData(0, 0, iconCanvas.width, iconCanvas.height)});
}

function updateIcon(ttsEventType) {
    switch(ttsEventType) {
        case("start"): iconDrawer.drawPlaying(); break;
        case("end"): iconDrawer.drawTurnedOn(); break;
        case("error"): iconDrawer.drawError(); break;
    }
}

function drawIcon(turnedOn) {
    if(turnedOn) iconDrawer.drawTurnedOn();
    else iconDrawer.drawTurnedOff();
}

// ===================================== others =====================================

const userInteractionAudio = new Audio("background/" + popUrl);    // TODO why "background/" needed?
userInteractionAudio.volume = 0.5;

// register IBM TTS
chrome.ttsEngine.onSpeak.addListener(ibmTts.speakListener);
chrome.ttsEngine.onStop.addListener(ibmTts.stopListener);

// initial content script injection - so no Chrome restart is needed after installation
chrome.tabs.query({}, function(tabs) {
    for (var i=0; i<tabs.length; i++) {
        chrome.tabs.executeScript(tabs[i].id, {file: 'content/content.js'}, () => chrome.runtime.lastError);
    }
});