import * as iconDrawer from "./icon/drawer.js";
import { sendAnalytics, scheduleAnalytics } from "./analytics.js";
import * as ibmTts from "./tts/IbmTtsEngine.js";
import * as textSplitter from "./tts/TextSplitter.js";
import { getVoiceName, getDefaultVoiceName, rejectVoice } from "./tts/VoiceSelector.js";

var ports = new Set();
chrome.runtime.onConnect.addListener(port => port.onMessage.addListener(message => {
	ports.add(port);
	port.onDisconnect.addListener(() => ports.delete(port));

	var action = message["action"];
	var listener = messageListeners[action];
	if(listener) listener(message, port);
}));

// ===================================== incoming messages =====================================
var messageListeners = {};
messageListeners.getSettings = (message,port) => {
	chrome.storage.local.get(null, settings => port.postMessage({action:"updateSettings", settings:settings}));
};

messageListeners.read = (request,port) => {
	if(!request.text) {
		iconDrawer.drawTurnedOn();	// show on-status after interaction animation (removes error color)
		chrome.tts.stop();
		notifyContent(port, {type:"end"});	// empty speech request ends right away
		scheduleAnalytics('tts-read', 'tts', 'stop', 'stop-'+request.source);	//schedule so browserSelect double+triple click counts as one
		return;
	}

	iconDrawer.drawLoading();

	var settingsPromise = new Promise(resolve => chrome.storage.local.get(null, resolve));
	var voiceNamePromise = getVoiceName(request.text, request.lan);
	Promise.all([settingsPromise,voiceNamePromise]).then(
		([settings,voiceName]) => chrome.tts.speak(request.text, {voiceName:voiceName, rate:settings.speed, onEvent:event=>onTtsEvent(event, voiceName, settings.speed)} )
		,() => onNoMatchingVoice()
	);
	const onTtsEvent = (event,voiceName,speed) => {
		updateIcon(event.type);
		notifyContent(port, event, request.text);
		if(voiceName.startsWith("Google")) applyGoogleTtsBugWorkaround(event.type, speed);
		if(event.type == "error") rejectVoice(voiceName);
	};
	const onNoMatchingVoice = () => {
		notifyContent(port, {type:"error"});
		iconDrawer.drawError();
	};

	// anyltics
	scheduleAnalytics('tts-read', 'tts', 'read', 'read'+request.source);	//schedule so browserSelect double+triple click counts as one
};
messageListeners.arrowPressed = (message,port) => {
	userInteractionAudio.currentTime = 0;
	userInteractionAudio.play();
	iconDrawer.drawInteraction();
	scheduleAnalytics('arrowPressed', 'arrow', 'pressed', null);
};

// https://bugs.chromium.org/p/chromium/issues/detail?id=335907
var scheduledPuseResume;
function applyGoogleTtsBugWorkaround(eventType,speed) {
	// pauseResum() generates noise, should be infrequent but frequent enough for for the seech to not get stuck
	const repeateInterval = 5000 / speed;
	switch(eventType) {
		case("start"): scheduledPuseResume = scheduledPuseResume || setInterval(pauseResume, repeateInterval); break;
		case("end"):
		case("interrupted"):
		case("error"): scheduledPuseResume = clearInterval(scheduledPuseResume);
	}
}
function pauseResume() {
	chrome.tts.pause();
	chrome.tts.resume();
}

// ===================================== outgoing messages to content =====================================
function notifyContent(port, chromeTtsEvent, text) {
	const contentNofifier = ttsEventToContentNotifier[chromeTtsEvent.type];
	if(contentNofifier) contentNofifier(port, chromeTtsEvent, text);
}

var ttsEventToContentNotifier = {};
ttsEventToContentNotifier.sentence = (port,chromeTtsEvent,text) => {
	const startOffset = chromeTtsEvent.charIndex;
	const endOffset = textSplitter.nextSentenceEnd(text, startOffset);
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
	if(items.hasOwnProperty("turnedOn")) drawIcon(items.turnedOn);
	else populateDefaultSettings();
});

function populateDefaultSettings() {
	getDefaultVoiceName().then((voice) => {
		sendAnalytics('settings','setup','defaults-' + chrome.app.getDetails().version);
		chrome.storage.local.set({
			turnedOn: true
			,preferredVoice: voice
			,speed: 1.2
			,hoverSelect: true
			,arrowSelect: false
			,browserSelect: false
		}, () => drawIcon(true));
	});
}

chrome.storage.onChanged.addListener(changes => {
	for(var setting in changes) {
		if(setting == "turnedOn") handleOnOffEvent(changes.turnedOn.newValue);
		if(changes[setting].oldValue !== undefined) scheduleAnalytics('set'+setting, 'settings','set', setting+':'+changes[setting].newValue);	// no analytics when default
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

// const audioUrl = require("../pop.wav");
const audioUrl = "nah"; // TODO fix wav import...
var userInteractionAudio = new Audio(audioUrl);
userInteractionAudio.volume = 0.6;

// register IBM TTS
chrome.ttsEngine.onSpeak.addListener(ibmTts.speakListener);
chrome.ttsEngine.onStop.addListener(ibmTts.stopListener);

// initial content script injection - so no Chrome restart is needed after installation
chrome.tabs.query({}, function(tabs) {
	for (var i=0; i<tabs.length; i++) {
		chrome.tabs.executeScript(tabs[i].id, {file: 'content/content.js'}, () => chrome.runtime.lastError);
	}
});
