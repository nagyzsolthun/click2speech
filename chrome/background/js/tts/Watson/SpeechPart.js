/** speech for for text that fits in 1 tts request */
define(["tts/Watson/UrlBuilder"], function(UrlBuilder) {
/** @param c.text
 * @param c.WatsonVoice
 * @param c.scheduleMarkers */
return function(c) {
	this.sendHttpRequests = function() {
		setHttpRequestSentTime();
		requestAudio();

		//not in this.play() because the audioAvailable event may happen before this.play() is called (canplaytrhrough, error)
		scheduleRequestNextEvent();
		scheduleErrorEvent();
	}

	this.play = function() {
		setPlayRequestedFlag();
		scheduleLoadingEvent();
		scheduleStartEvent();
		scheduleEndEvent();
		if(anyError()) sendErrorEvent();
		else playAudioWhenAvailable();
	}

	this.stop = function() {
		removeExternalEventListener();
		pauseAudio();
		removeAudioEvenetListeners();
		removeAudioSrc();
	}

	//support testing
	this.causeError = function() {
		audio.src = "this_shoud_cause_error";
	}

	Object.defineProperty(this, 'onEvent', {set: function(onEvent) {
		externalEventListener = onEvent;
	}});

	Object.defineProperty(this, 'speed', {set: function(speed) {
		audio.defaultPlaybackRate = speed;	//effective when audio not yet started playing
		audio.playbackRate = speed;	//effective if audio is playing
	}});

	Object.defineProperty(this, 'text', {get: function() {
		return c.text;
	}});
	
	// =================================== audio events ===================================
	
	function setHttpRequestSentTime() {httpRequestSentTime = Date.now()};
	var httpRequestSentTime;

	var audioAvailable = false;
	var audioAvailableListeners = [];
	function requestAudio() {
		audio.src = UrlBuilder.build({text:c.text, WatsonVoice:c.WatsonVoice});
		addAudioEventListener("canplaythrough", function() {
			audioAvailable = true;
			audioAvailableListeners.forEach(call);
		});
	}
	
	function call(fn) {
		fn();
	}


	function playAudioWhenAvailable() {
		if(audioAvailable) {
			audio.play();
		} else {
			audioAvailableListeners.push(function(){audio.play()});
			externalEventListener({type:"loading"});
		}
	}

	function pauseAudio() {audio.pause()};
	function removeAudioSrc() {audio.src = ""}	//to make sure GC happens

	function scheduleRequestNextEvent() {
		audioAvailableListeners.push(function() {
			setLoadingSeconds();
			addAudioTimeReachedListener(getRequestNextAudioTime, sendRequestNextEvent);
		});
	}
	var loadingSeconds;
	function setLoadingSeconds() {loadingSeconds = (Date.now() - httpRequestSentTime) / 1000.0};
	function getRequestNextAudioTime() {return audio.duration - 2*loadingSeconds*audio.playbackRate};	//TODO audio duration is infinity
	function sendRequestNextEvent() {externalEventListener({type:"requestNext"})};

	function scheduleErrorEvent() {addAudioEventListener("error", onAudioError)}
	function scheduleLoadingEvent() {addAudioEventListener("waiting", onAudioWaiting)}
	function scheduleStartEvent() {addAudioEventListener("playing", onAudioPlaying)}	//must be added after audio.play called, otherwise audio.play will trigger it
	function scheduleEndEvent() {
		addAudioEventListener("ended", sendEndEvent);
		addAudioEventListener("pause", sendEndEvent);
	}

	function anyError() {return !audio.src || errorFlag}	//audio.src missing means the requestNext logic failed in the previous audio
	function sendErrorEvent() {externalEventListener({type:"error"})};

	function onAudioWaiting() {externalEventListener({type:"loading"})};
	function onAudioPlaying() {
		if(!c.scheduleMarkers) externalEventListener({type:"playing"});
		else externalEventListener({type:"playing",startOffset:0,endOffset:c.text.length,text:c.text})
	};
	function sendEndEvent() {
		//remove audio event listeners - otherwise called twice (probably a bug related to the OGG format)
		audio.removeEventListener("ended", sendEndEvent);
		audio.removeEventListener("pause", sendEndEvent);
		externalEventListener({type:"end"})
	};
	function onAudioError() {
		setErrorFlag();
		if(playRequestedFlag) sendErrorEvent();
	}

	function setErrorFlag() {errorFlag = true};
	var errorFlag = false;

	function setPlayRequestedFlag() {playRequestedFlag = true};
	var playRequestedFlag = false;

	var audioEventListeners = [];

	/** add events through this function so we can remove eventListeners later - to make sure GC collects the audio */
	function addAudioEventListener(event,listener) {
		audioEventListeners.push({event:event, listener:listener});
		audio.addEventListener(event,listener);
	}

	function removeAudioEvenetListeners() {
		audioEventListeners.forEach(function(eventListener) {audio.removeEventListener(eventListener.event,eventListener.listener)});
		audioEventListeners = [];
	}

	function removeExternalEventListener() {
		externalEventListener = function(event){}	//so no error is raised
	}
	
	// =================================== general ===================================

	/** calls @param callback when audio reaches result of @param calcTime time (given relative to the audio's own time)
	 * calcTime is a function so replaySpeed can change */
	function addAudioTimeReachedListener(calcTime, callback) {
		//check on every timeupdate so changing speed dont effect behavior
		addAudioEventListener("timeupdate", onAudioTimeUpdate);
		addAudioEventListener("waiting", removeScheduledCallback);
		addAudioEventListener("pause", removeScheduledCallback);
		addAudioEventListener("ended", removeScheduledCallback);
		addAudioEventListener("error", removeScheduledCallback);
		
		var scheduledCallback;
		function onAudioTimeUpdate() {
			removeScheduledCallback();
			scheduledCallback = window.setTimeout(onTimeReached, milliSecondsTillTime());
		}
		function onTimeReached() {
			audio.removeEventListener("timeupdate",onAudioTimeUpdate);
			audio.removeEventListener("waiting",removeScheduledCallback);
			callback();
		}
		function removeScheduledCallback() {if(scheduledCallback) window.clearTimeout(scheduledCallback)}
		function milliSecondsTillTime() {return 1000*((calcTime()-audio.currentTime)/audio.playbackRate)}
	}

	// =================================== init ===================================
	var audio = new Audio();

	var externalEventListener = function(){};
}
});
