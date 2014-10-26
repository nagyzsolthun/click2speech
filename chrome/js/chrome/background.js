require.config({
	baseUrl: "/../js/modules"
});
require(["../chrome/SettingsHandler","GoogleTts","IconDrawer"], function(settingsHandler, ttsService, iconDrawer) {
	var iconCanvas = document.getElementById("iconTemplate");
	iconDrawer.setCanvas(iconCanvas);
	
	/** iconDrawer draws the icon on a canvas, this function shows the canvas on the toolbar */
	function loadIconToToolbar() {
		chrome.browserAction.setIcon({
			imageData: iconCanvas.getContext("2d").getImageData(0, 0, 19, 19)
		});
	}

	// ===================================== handle messages =====================================
	
	function read(c) {
		settingsHandler.getAll(function(settings) {
			if(! settings.turnedOn) {return;}
			ttsService.read({
				text:c.text
				,lan:c.lan
				,speed:settings.speed
			});
		});
	}

	function turnOn() {
		iconDrawer.drawTurnedOn(0);
		loadIconToToolbar();
	}

	function turnOff() {
		ttsService.stop();	//in case it is reading, we stop it
		iconDrawer.drawTurnedOff();
		loadIconToToolbar();
	}

	/** notifies the contentjs' to set their readEvents */
	function sendSetReadEvent() {
		chrome.tabs.query({}, function(tabs) {
			settingsHandler.getAll(function(settings) {
				var message = {action:"webReader.setReadEvent",readEvent:settings.readEvent};
				for (var i=0; i<tabs.length; i++) {
					chrome.tabs.sendMessage(tabs[i].id, message);
				}
			});
		});
	}
	
	// ========================================= handling messages =========================================
	//receiving messages from cotnent script (to read) and popup (turnon/turnoff/getstatus)
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			console.log(request.action + " received");
			switch(request.action) {
				case("webReader.getSettings"):
					settingsHandler.getAll(function(settings){
						sendResponse(settings);
					});
					break;
				case("webReader.turnOn"):
					settingsHandler.set("turnedOn",true);
					turnOn();
					break;
				case("webReader.turnOff"):
					settingsHandler.set("turnedOn",false);
					turnOff();
					break;
				case("webReader.setReadEvent"):
					settingsHandler.set("readEvent",request.readEvent);
					sendSetReadEvent();
					break;
				case("webReader.setSpeed"):
					settingsHandler.set("speed",request.speed);
					ttsService.setSpeed(request.speed);
					break;
				case("webReader.read"):
					read({text: request.text,lan: request.languageOfDocumentttsService || navigator.language});
					break;
			}
		}
	);

	// ===================================== initial settings =====================================
	sendSetReadEvent();

	//icon is redrawn when volume of speech changes
	var audioAnalyser = ttsService.getAudioAnalyser();
	var frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
	var previousVolume = null;
	setInterval(function(){
		settingsHandler.getAll(function(settings) {
			if(!settings.turnedOn) {return;}
			audioAnalyser.getByteFrequencyData(frequencyData);
			var currentVolume = (frequencyData[0]/255);	//TODO this should be average or max or something..
			if(previousVolume != currentVolume) {
				iconDrawer.drawTurnedOn(currentVolume);
				loadIconToToolbar();
			}
		});
	},10);
});