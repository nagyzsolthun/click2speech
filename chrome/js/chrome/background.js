require.config({
	baseUrl: "/../js/modules"
});
require(["GoogleTts","IconDrawer"], function(ttsService, iconDrawer) {
	var turnedOn = true;
	var speed = 1;
	var iconCanvas = document.getElementById("iconTemplate");
	
	/** iconDrawer draws the icon on a canvas, this function shows the canvas on the toolbar */
	function loadIconToToolbar() {
		chrome.browserAction.setIcon({
			imageData: iconCanvas.getContext("2d").getImageData(0, 0, 19, 19)
		});
	}
	iconDrawer.setCanvas(iconCanvas);

	function read(text, lan) {
		if(! turnedOn) {return;}
		ttsService.read(text,lan);
	}

	function turnOn() {
		turnedOn = true;
		iconDrawer.drawTurnedOn(0);
		loadIconToToolbar();
		chrome.runtime.sendMessage({action: "tts-turnedOn"});
		chrome.storage.local.set({'tts-status': 'on'}, function() {});
	}

	function turnOff() {
		turnedOn = false;
		ttsService.stop();	//in case it is reading, we stop it
		iconDrawer.drawTurnedOff();
		loadIconToToolbar();
		chrome.runtime.sendMessage({action: "tts-turnedOff"});
		chrome.storage.local.set({'tts-status': 'off'}, function() {});
	}

	function setSpeed(newSpeed) {
		speed = newSpeed;
		ttsService.setSpeed(speed);
	}

	//initial setting of status (on/off)
	chrome.storage.local.get('tts-status', function(items) {
		var status = items['tts-status'];
		if(status == 'on') {
			turnOn();
		} else {
			turnOff();
		}
	});

	//initial setting of speed
	chrome.storage.local.get('tts-speed', function(items) {
		speed = items['tts-speed'] || 1;
	});

	//icon is redrawn when volume of speech changes
	var audioAnalyser = ttsService.getAudioAnalyser();
	var frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
	var previousVolume = 0;
	setInterval(function(){	
		if(! turnedOn) {return;}
		audioAnalyser.getByteFrequencyData(frequencyData);
		var currentVolume = (frequencyData[0]/255);	//TODO this should be average or max or something..
		if(previousVolume != currentVolume) {
			iconDrawer.drawTurnedOn(currentVolume);
			loadIconToToolbar();
		}
	},10);

	//receiving messages from cotnent script (to read) and popup (turnon/turnoff/getstatus)
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			console.log(request.action + " received");
			switch(request.action) {
				case("tts-read"): read({
					text: request.textToSpeech
					,lan: request.languageOfDocument || navigator.language
					,speed: speed
				}); break;
				case("tts-turnOn"): turnOn(); break;
				case("tts-turnOff"): turnOff(); break;
				case("tts-getStatus"): turnedOn ? sendResponse({turnedOn:true}) : sendResponse({turnedOn:false}); break;
				case("tts-setSpeed"): setSpeed(request.speed); break;
				case("tts-getSpeed"): sendResponse({speed: speed}); break;
			}
		});
});