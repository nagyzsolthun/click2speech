/** speech for for text that fits in 1 tts request */
define(["tts/iSpeech/UrlBuilder", "HttpRequest","tts/WordPositionFinder"], function(UrlBuilder,HttpRequest,WordPositionFinder) {
/** @param c.text
 * @param c.iSpeechVoice
 * @param c.scheduleMarkers */
return function(c) {
	this.sendHttpRequests = function() {
		setHttpRequestSentTime();
		requestAudio();
		requestMarkers();
		scheduleOnAllDataAvailable();

		//not in this.play() because the allDataAvailable event may happen before this.play() is called (canplaytrhrough, error)
		scheduleRequestNextEvent();
		scheduleErrorEvent();
	}

	this.play = function() {
		setPlayRequestedFlag();
		scheduleLoadingEvent();
		scheduleStartEvent();
		scheduleEndEvent();
		if(anyError()) sendErrorEvent();
		else playAudioWhenAllDataAvailable();
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
		audio.defaultPlaybackRate = speed * SPEED_FACTOR;	//effective when audio not yet started playing
		audio.playbackRate = speed * SPEED_FACTOR;	//effective if audio is playing
	}});

	Object.defineProperty(this, 'text', {get: function() {
		return c.text;
	}});
	
	// =================================== allDataAvailable ===================================

	function setHttpRequestSentTime() {httpRequestSentTime = Date.now()};
	var httpRequestSentTime;

	var audioCanPlayThrough = false;

	/** schedules callback when both audio data and markers are available */
	function scheduleOnAllDataAvailable() {
		markersRequest.addEventListener("success", callAllDataAvailableIfSo);
		addAudioEventListener("canplaythrough", function() {
			audioCanPlayThrough = true;
			callAllDataAvailableIfSo();
		});
	}

	var allDataAvailable = false;
	var allDataAvailableListeners = [];
	function callAllDataAvailableIfSo() {
		allDataAvailable = true;
		if(audioCanPlayThrough && markersRequest.done) {
			allDataAvailableListeners.forEach(call);
		}
	}

	function call(fn) {
		fn();
	}

	// =================================== audio events ===================================

	function requestAudio() {
		audio.src = UrlBuilder.build({text:c.text, iSpeechVoice:c.iSpeechVoice, action:"convert"});
	}

	function playAudioWhenAllDataAvailable() {
		if(allDataAvailable) {
			audio.play();
		} else {
			allDataAvailableListeners.push(function(){audio.play()});
			externalEventListener({type:"loading"});
		}
	}

	function pauseAudio() {audio.pause()};
	function removeAudioSrc() {audio.src = ""}	//to make sure GC happens

	function scheduleRequestNextEvent() {
		allDataAvailableListeners.push(function() {
			setLoadingSeconds();
			addAudioTimeReachedListener(getRequestNextAudioTime, sendRequestNextEvent);
		});
	}
	var loadingSeconds;
	function setLoadingSeconds() {loadingSeconds = (Date.now() - httpRequestSentTime) / 1000.0};
	function getRequestNextAudioTime() {return lastWordEndTime - 2*loadingSeconds*audio.playbackRate};
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
	function onAudioPlaying() {externalEventListener({type:"playing"})};
	function sendEndEvent() {externalEventListener({type:"end"})};
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

	// =================================== marker events ===================================

	var markersRequest;
	function requestMarkers() {
		var url = UrlBuilder.build({text:c.text, iSpeechVoice:c.iSpeechVoice, action:"markers"});
		markersRequest = new HttpRequest(url);
		markersRequest.addEventListener("success", onMarkersReceived);
	}
	
	function onMarkersReceived(iSpeechMarkersXmlString) {
		var wordTimeMarkers = getWordTimeMarkers(iSpeechMarkersXmlString);
		if(c.scheduleMarkers) scheduleMarkers(wordTimeMarkers);

		lastWordEndTime = wordTimeMarkers[wordTimeMarkers.length-1].end/1000;
		schedulePromoCutOff();
	}

	function scheduleMarkers(wordTimeMarkers) {
		var wordPositions = getWordPositions();
		for(var i=0; i<wordTimeMarkers.length; i++) {
			var word = wordTimeMarkers[i].word;
			var position = popWordPositionItem(wordPositions, word);	//iSpeech words do not always match our words - this function tries to match them
			scheduleMarkerEvent({
				startTime:		wordTimeMarkers[i].start
				,endTime:		wordTimeMarkers[i].end
				,startOffset:	position.start
				,endOffset:		position.end
				,text:			position.word
			});
		}
	}

	/** @param marker {startTime,startOffset,endTime,endOffset */
	function scheduleMarkerEvent(marker) {
		addAudioTimeReachedListener(
			function() {return marker.startTime / 1000;}
			,function() {externalEventListener({type:"playing",startOffset:marker.startOffset,endOffset:marker.endOffset,text:marker.text})}
		);
		//no marker sent when marker.endTime, it results in less flashing
	}

	var lastWordEndTime;
	function schedulePromoCutOff() {
		addAudioTimeReachedListener(function() {return lastWordEndTime - 0.05}, pauseAudio);	//some languages (Hungarian..) have sync issues, -0.05 fixes it
	}
	
	/** @return array of {start, end} objects with the starting/ending times of words */
	function getWordTimeMarkers(iSpeechMarkersXmlString) {
		var startEndTimeNodes = (new DOMParser()).parseFromString(iSpeechMarkersXmlString, "text/xml").getElementsByTagName('word');

		var result = [];
		for(var i=0; i<startEndTimeNodes.length; i++) {
			var marker = {};
			marker.start = parseInt(startEndTimeNodes[i].getElementsByTagName('start')[0].innerHTML);
			marker.end = parseInt(startEndTimeNodes[i].getElementsByTagName('end')[0].innerHTML);
			marker.word = startEndTimeNodes[i].getElementsByTagName('text')[0].innerHTML;
			result.push(marker);
		}
		return result;
	}
	
	/** @return array of {startOffset,endOffset} objects with the character positions of words */
	function getWordPositions() {
		var result = WordPositionFinder.getPositions(c.text);
		return result;
	}

	/** @return the first wordPosition item from param wordPositions that matches @param word
	 * also removes the element from wordPositions */
	function popWordPositionItem(wordPositions, iSpeechWord) {
		var word = WordPositionFinder.matchingPart(iSpeechWord);	//e.g. to remove punctuations from words in Hungarian speech
		var index = wordPositions.findIndex(matchingPosition);
		function matchingPosition(position) {return position.word == word}

		if(index > -1) return wordPositions.splice(index, 1)[0];
		else return {};	//TODO test this case somehow
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
	var SPEED_FACTOR = 0.9;	//to match speed before removal of "speed" URL param

	var externalEventListener = function(){};
}
});
