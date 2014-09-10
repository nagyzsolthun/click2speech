var turnedOn = true;

var iconDrawer = new IconDrawer();
var ttsService = new GoogleTts();

function read(text, lan) {
	if(! turnedOn) {return;}
	ttsService.read(text,lan);
}

function turnOn() {
	turnedOn = true;
	iconDrawer.drawTurnedOn(0);
	chrome.runtime.sendMessage({action: "tts-turnedOn"});
	chrome.storage.local.set({'tts-status': 'on'}, function() {});
}

function turnOff() {
	turnedOn = false;
	ttsService.stop();	//in case it is reading, we stop it
	iconDrawer.drawTurnedOff();
	chrome.runtime.sendMessage({action: "tts-turnedOff"});
	chrome.storage.local.set({'tts-status': 'off'}, function() {});
}

var audioAnalyser = ttsService.getAudioAnalyser();
var frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);

//icon is redrawn when volume of speech changes
var previousVolume = 0;
setInterval(function(){	
	if(! turnedOn) {return;}
	audioAnalyser.getByteFrequencyData(frequencyData);
	var currentVolume = (frequencyData[0]/255);	//TODO this should be average or max or something..
	if(previousVolume != currentVolume) {
		iconDrawer.drawTurnedOn(currentVolume);
	}
},10);

//initial setting
chrome.storage.local.get('tts-status', function(items) {
	var status = items['tts-status'];
	if(status == 'on') {
		turnOn();
	} else {
		turnOff();
	}
});

//receiving messages from cotnent script (to read) and popup (turnon/turnoff/getstatus)
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(request.action + " received");
		switch(request.action) {
			case("tts-read"): read({
				text: request.textToSpeech
				,lan: request.languageOfDocument || navigator.language
				,speed: request.speedOfSpeech || 1
			}); break;
			case("tts-turnOn"): turnOn(); break;
			case("tts-turnOff"): turnOff(); break;
			case("tts-getStatus"): turnedOn ? sendResponse({turnedOn:true}) : sendResponse({turnedOn:false}); break;
		}
	});