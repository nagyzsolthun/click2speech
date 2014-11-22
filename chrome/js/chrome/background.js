require.config({
	baseUrl: "/../js/modules"
});
require(["../chrome/SettingsHandler","GoogleTts","IconDrawer"], function(settingsHandler, ttsService, iconDrawer) {
	var iconCanvas = document.getElementById("iconTemplate");
	iconDrawer.canvas = iconCanvas;
	iconDrawer.onRenderFinished = loadIconToToolbar;
	
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
			ttsService.read({text:c.text,lan:c.lan});
		});
	}

	/** notifies the contentjs' to set their selectEvents */
	function sendSetSelectEvent() {
		chrome.tabs.query({}, function(tabs) {
			settingsHandler.getAll(function(settings) {
				var message = {action:"webReader.setSelectEvent",selectEvent:settings.selectEvent};
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
					iconDrawer.drawTurnedOn();
					break;
				case("webReader.turnOff"):
					settingsHandler.set("turnedOn",false);
					ttsService.stop();	//in case it is reading, we stop it
					iconDrawer.drawTurnedOff();
					break;
				case("webReader.setSelectEvent"):
					settingsHandler.set("selectEvent",request.selectEvent);
					sendSetSelectEvent();
					break;
				case("webReader.setSpeed"):
					settingsHandler.set("speed",request.speed);
					ttsService.setSpeed(request.speed);
					break;
				case("webReader.read"):
					read({text: request.text,lan: request.lan || navigator.language});
					break;
			}
		}
	);

	// ===================================== initial settings =====================================
	sendSetSelectEvent();
	settingsHandler.getAll(function(settings) {
		ttsService.setSpeed(settings.speed);
		if(settings.turnedOn) iconDrawer.drawTurnedOn();
		else iconDrawer.drawTurnedOff();
	});
	
	ttsService.onStart = function() {
		iconDrawer.drawPlaying()
	}
	
	ttsService.onEnd = function() {
		iconDrawer.drawTurnedOn()
	}
});