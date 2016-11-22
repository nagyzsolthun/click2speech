require(["SettingsHandler", "MessageHandler", "tts/TtsProvider","icon/drawer"], function(settingsHandler, messageHandler, tts, iconDrawer) {

	//===================================== Google Anyltics =====================================
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','https://ssl.google-analytics.com/analytics.js','analytics');

	analytics('create', 'UA-67507804-1', 'auto');	//create tracker
	analytics('set', 'checkProtocolTask', function(){})	//https://code.google.com/p/analytics-issues/issues/detail?id=312
	analytics('set', 'page', '/background');
	
	/** sends Google Analitics event - lifted up as a function so we dont send events while development */
	function sendAnalytics(category,action,label) {
		//analytics('send', 'event', category, action, label);
		console.log("send event; category:" + category + " action:" + action + " label:" + label);
	}
	
	/** some events occoure many times in a short period (e.g. changing speed occours every time the speed range changes in options)
	 * this function sends analytics request only if no change happens for 1 sec
	 * @param key defines the event to be scheduled (e.g. setspeed - when changing speed, label is different for each step, we only want to send the last state) */
	var event2scheduledAnalytics = {};
	function scheduleAnalytics(key,category,action,label) {
		var scheduled = event2scheduledAnalytics[key];
		if(scheduled) clearTimeout(scheduled);
		
		scheduled = window.setTimeout(function() {
			event2scheduledAnalytics[key] = undefined;
			sendAnalytics(category,action,label);
		}, 1000);
		event2scheduledAnalytics[key] = scheduled;
	}
	
	// ===================================== handle messages =====================================

	var iconCanvas = document.createElement("canvas");
	//19px is the size of the icons https://developer.chrome.com/extensions/browserAction#icon
	iconCanvas.width = iconCanvas.height = 18;
	iconDrawer.canvas = iconCanvas;
	iconDrawer.onRenderFinished = loadIconToToolbar;
	
	var userInteractionAudio = new Audio();
	userInteractionAudio.src = "pop.wav";
	userInteractionAudio.volume = 0.6;
	
	/** iconDrawer draws the icon on a canvas, this function shows the canvas on the toolbar */
	function loadIconToToolbar() {
		chrome.browserAction.setIcon({
			imageData: iconCanvas.getContext("2d").getImageData(0, 0, 19, 19)
		});
	}
	
	function read(c) {
		settingsHandler.getAll(function(settings) {
			//markers are only shown by content oage in case of highlightedElement (and not in case of browserselect)
			var scheduleMarkers = c.text && (c.source == "hoveredClick" || c.source == "space");
			tts.read({speechId:c.speechId, text:c.text, lan:c.lan, speed:settings.speed, scheduleMarkers:scheduleMarkers});
			var action = c.text?"read":"stop";
			var label = c.source;
			scheduleAnalytics('tts-read', 'tts', action, action+"-"+label);	//schedule so browserSelect double+triple click counts as one
		});
	}
	
	function onTtsEvent(event) {
		messageHandler.messageAll({action:"ttsEvent", event:event})
		switch(event.type) {
			case("loading"): iconDrawer.drawLoading(); break;
			case("playing"): iconDrawer.drawPlaying(); break;
			case("end"): iconDrawer.drawTurnedOn(); break;
			case("error"):
				iconDrawer.drawError();
				sendAnalytics('tts', 'error'); break;
				break;
		}
	}
	
	function updateSetting(setting, value) {
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
				messageHandler.messageAll({action:"updateSetting", setting:setting, value:value});
				break;
			case("speed"): tts.speed = value; break;
			case("hoverSelect"):
			case("arrowSelect"):
			case("browserSelect"): messageHandler.messageAll({action:"updateSetting", setting:setting, value:value});break;
		}
	}

	//receiving messages from cotnent script (to read) and popup (turnon/turnoff/getstatus)
	var messageListeners = {};
	messageHandler.onMessage = function(message,port) {
		var listener = messageListeners[message.action];
		if(listener) listener(message,port);
		else console.log("no listener for action " + message.action);
	}

	messageListeners.getSettings = function(message,port) {
		settingsHandler.getAll(function(settings){
			port.postMessage({action:"updateSettings", settings:settings});
		});
	}
	messageListeners.read = function(message) {
		read({speechId:message.speechId, text:message.text, lan:message.lan || navigator.language, source:message.source});
	}
	messageListeners.arrowPressed = function() {
		settingsHandler.getAll(function(settings) {
			userInteractionAudio.currentTime = 0;
			userInteractionAudio.play();
		});
		iconDrawer.drawInteraction();
		scheduleAnalytics('arrowPressed', 'arrow', 'pressed');
	}
	messageListeners.getTtsErrors = function(message,port) {
		port.postMessage({action:"updateTtsErrors",errors:tts.errors});
	}
	messageListeners.updateSetting = function(message,port) {
		updateSetting(message.setting,message.value);
		scheduleAnalytics('set' + message.setting, 'settings','set',message.setting+':'+message.value);	//schedule so speed changes count as one
	}
	messageListeners.getTtsProperties = function(message,port) {
		port.postMessage({action:"updateTtsProperties", ttsProperties:tts.ttsProperties});
	}
	messageListeners.testTtsService = function(message,port) {
		tts.test(message.tts, function(success) {
			port.postMessage({action:"updateTtsAvailable", tts:message.tts, available:success});
		});
	}
	messageListeners.contactInteraction = function(message) {
		sendAnalytics('contact','interaction',message.interaction);
	}

	// ===================================== initial settings =====================================
	settingsHandler.getAll(function(settings) {
		tts.preferredTts = settings.preferredTts;
		tts.speed = settings.speed;
		tts.onEvent = settings.turnedOn?onTtsEvent:null;
		if(settings.turnedOn) iconDrawer.drawTurnedOn();
		else iconDrawer.drawTurnedOff();
	}, function(defaults) {
		console.log("persist default settings: " + JSON.stringify(defaults));
		//default setting for turnedOn set => means first ever execution
		if(defaults.turnedOn) sendAnalytics('settings','setup','defaults-' + chrome.app.getDetails().version);
	});

	function muteChromeRuntimeError() {
		var error = chrome.runtime.lastError;
	}

	//initial content script injection - so no Chrome restart is needed after installation
	chrome.tabs.query({}, function(tabs) {
		for (var i=0; i<tabs.length; i++) {
			chrome.tabs.executeScript(tabs[i].id, {file: 'content/content.js'}, muteChromeRuntimeError);
		}
	});
});
