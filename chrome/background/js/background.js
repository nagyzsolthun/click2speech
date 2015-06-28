require(["SettingsHandler", "tts/TtsProvider","icon/drawer"], function(settingsHandler, tts, iconDrawer) {
	var iconCanvas = document.createElement("canvas");
	//19px is the size of the icons https://developer.chrome.com/extensions/browserAction#icon
	iconCanvas.width = iconCanvas.height = 18;
	iconDrawer.canvas = iconCanvas;
	iconDrawer.onRenderFinished = loadIconToToolbar;
	
	var userInteractionAudio = new Audio();
	userInteractionAudio.src = "pop.wav";
	
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
			tts.read({text:c.text,lan:c.lan,speed:settings.speed});
		});
	}
	
	/** notifies all content scripts */
	function notifyContentJs(message) {
		chrome.tabs.query({}, function(tabs) {
			for (var i=0; i<tabs.length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, message);
			}
		});
	}
	
	function onTtsEvent(event) {
		notifyContentJs({action:"event", event:event.type});
		switch(event.type) {
			case("loading"): iconDrawer.drawLoading(); break;
			case("start"): iconDrawer.drawPlaying(); break;
			case("end"): iconDrawer.drawTurnedOn(); break;
			case("error"): iconDrawer.drawError(); break;
		}
	}
	
	// ========================================= handling messages =========================================
	function set(setting, value) {
		console.log("set " + setting + ": " + value + " received");
		settingsHandler.set(setting,value);
		switch(setting) {
			case("turnedOn"):
				if(value) {
					tts.onEvent = onTtsEvent;
					iconDrawer.drawTurnedOn();
				}
				else {
					tts.onEvent = null;	//so the 'end' event wont redraw the icon
					tts.read({text:""});	//in case it is reading, we stop it
					iconDrawer.drawTurnedOff();
				}
				notifyContentJs({action:"set", setting:setting, value:value});
				break;
			case("speed"): tts.speed = value; break;
			case("selectType"):
			case("highlightOnHover"):
			case("highlightOnArrows"):
			case("readOnClick"):
			case("readOnSpace"):
			case("noDelegateFirstClick"): notifyContentJs({action:"set", setting:setting, value:value});break;
		}
	}
	
	//receiving messages from cotnent script (to read) and popup (turnon/turnoff/getstatus)
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			switch(request.action) {
				case("getSettings"):
					console.log("getSettings received");
					settingsHandler.getAll(function(settings){
						sendResponse(settings);
					});
					return true;	//keeps sendResponse channel open until it is used
				case("getTtsProperties"):
					console.log("getTtsProperties received");
					sendResponse(tts.ttsProperties);
					break;
				case("testTtsService"):
					console.log("testTtsService received");
					tts.test(request.tts, sendResponse);
					return true;	//keeps sendResponse channel open until it is used
				case("getErrors"):
					console.log("getErrors received");
					sendResponse(tts.errors);
					break;
				case("read"):
					console.log("read received");
					read({text: request.text,lan: request.lan || navigator.language});
					break;
				case("stepHighlight"):
					settingsHandler.getAll(function(settings) {
						if(! settings.audioFeedbackOnArrows) return;
						userInteractionAudio.currentTime = 0;
						userInteractionAudio.play();
					});
					iconDrawer.drawInteraction();
					break;
				case("set"):
					console.log("set " + request.setting + ": " + request.value + " received");
					settingsHandler.set(request.setting,request.value);
					switch(request.setting) {
						case("turnedOn"):
							if(request.value) {
								tts.onEvent = onTtsEvent;
								iconDrawer.drawTurnedOn();
							}
							else {
								tts.onEvent = null;	//so the 'end' event wont redraw the icon
								tts.read({text:""});	//in case it is reading, we stop it
								iconDrawer.drawTurnedOff();
							}
							notifyContentJs({action:"set", setting:request.setting, value:request.value});break;
							break;
						case("speed"): tts.speed = request.value; break;
						case("selectType"):
						case("highlightOnHover"):
						case("highlightOnArrows"):
						case("readOnClick"):
						case("readOnSpace"): notifyContentJs({action:"set", setting:request.setting, value:request.value});break;
					}
					break;
			}
		}
	);

	// ===================================== initial settings =====================================
	settingsHandler.getAll(function(settings) {
		tts.preferredTts = settings.preferredTts;
		tts.speed = settings.speed;
		tts.onEvent = settings.turnedOn?onTtsEvent:null;
		if(settings.turnedOn) iconDrawer.drawTurnedOn();
		else iconDrawer.drawTurnedOff();
	});
});
