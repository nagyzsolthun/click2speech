/// <reference types="chrome"/>

import { scheduleAnalytics } from "./analytics.js";
import { nextSentenceEnd, nextWordEnd } from "./tts/TextSplitter.js";
import { getVoiceName, getDefaultVoiceName, updateDisabledVoices } from "./tts/VoiceSelector.js";
import * as iconDrawer from "./icon/drawer";
import * as ibmTts from "./tts/IbmTtsEngine.js";
import popUrl from "./pop.wav"

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

var messageListeners = {} as any;
messageListeners.getSettings = (message,port) => {
    chrome.storage.local.get(null, settings => port.postMessage({ action:"updateSettings", settings }));
};
messageListeners.read = (request,port) => {
    if(isEmpty(request.text)) {
        stop(request,port);
        return;
    }

    iconDrawer.drawLoading();

    var settingsPromise = new Promise(resolve => chrome.storage.local.get(null, resolve));
    var voiceNamePromise = getVoiceName(request.text);
    Promise.all([settingsPromise,voiceNamePromise])
        .then(([settings,voiceName]) => {
            const rate = settings.speed;
            const onEvent = (event: chrome.tts.TtsEvent) => onTtsEvent({ port, request, event, voiceName, rate });
            const options = { voiceName, rate, onEvent } as chrome.tts.SpeakOptions;
            chrome.tts.speak(request.text, options);
        }).catch(() => {
            notifyContent(port, {type:"error"});
            iconDrawer.drawError();
            scheduleAnalytics('tts', 'noVoice', getDisabledVoices().length+" disabled");
        });

    // anyltics
    scheduleAnalytics('tts', 'read', request.source);
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

function stop(request,port) {
    iconDrawer.drawTurnedOn();  // show on-status after interaction animation (removes error color)
    chrome.tts.stop();
    notifyContent(port, {type:"end"});  // empty speech request ends right away
    if(speaking) scheduleAnalytics('tts', 'stop', request.source);
    speaking = false;
}

function onTtsEvent({ port, request, event, voiceName, rate}) {
    updateIcon(event.type);
    updateSpeakingFlag(event.type);
    if(ports.has(port)) notifyContent(port, event, request.text);
    if(voiceName.startsWith("Google")) applyGoogleTtsBugWorkaround(event.type, rate);
    if(event.type == "error") errorVoice(voiceName);
}

// ===================================== error handling =====================================
const voiceNameToErrorTime = {};
const voiceNameToEnable = {};
function errorVoice(voiceName) {
    voiceNameToErrorTime[voiceName] = Date.now();
    updateDisabledVoices(getDisabledVoices());

    var enableId = voiceNameToEnable[voiceName];
    if(enableId) clearTimeout(enableId);

    enableId = setTimeout(() => {
        delete voiceNameToErrorTime[voiceName];
        delete voiceNameToEnable[voiceName];
        updateDisabledVoices(getDisabledVoices());
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
function applyGoogleTtsBugWorkaround(eventType,rate) {
    // pauseResum() generates noise, should be infrequent but frequent enough for for the seech to not get stuck
    const repeateInterval = 5000 / rate;
    switch(eventType) {
        case("start"): scheduledPauseResume = scheduledPauseResume || setInterval(pauseResume, repeateInterval); break;
        case("end"):
        case("interrupted"):
        case("error"): {
            if(scheduledPauseResume) clearInterval(scheduledPauseResume);
            scheduledPauseResume = null;
            break;
        }
    }
}
function pauseResume() {
    chrome.tts.pause();
    chrome.tts.resume();
}

// ===================================== speaking flag for anyltics =====================================

var speaking;
function updateSpeakingFlag(ttsEventType) {
    switch(ttsEventType) {
        case "start":
        case "sentence":
        case "word": speaking = true; break;
        default: speaking = false; break;
    }
}

// ===================================== outgoing messages to content =====================================
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
    const appVersion = (chrome as any).app.getDetails().version as string;  // TODO firefox

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
        chrome.tts.stop();
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
