/** speech for for text that fits in 1 tts request */
define(["tts/iSpeech/UrlBuilder", "Http","tts/WordPositionFinder"], function(UrlBuilder,Http,WordPositionFinder) {
/** @param c.text
 * @param c.iSpeechVoice
 * @param c.scheduleMarkers */
return function(c) {
	this.sendHttpRequests = function() {
		setHttpRequestSentTime();
		requestAudio();
		requestMarkers();

		//not in this.play() because the source events may happen before this.play() is called (canplaytrhrough, error)
		scheduleRequestNextEvent();
		scheduleErrorEvent();
	}

	this.play = function() {
		setPlayRequestedFlag();
		scheduleLoadingEvent();
		scheduleStartEvent();
		scheduleEndEvent();
		if(anyError()) sendErrorEvent();
		else audio.play();
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

	function requestAudio() {
		audio.src = UrlBuilder.build({text:c.text, iSpeechVoice:c.iSpeechVoice, action:"convert"});
	}

	function scheduleRequestNextEvent() {addAudioEventListener("canplaythrough", onAudioCanPlayThrough)}
	function scheduleErrorEvent() {addAudioEventListener("error", onAudioError)}
	function scheduleLoadingEvent() {addAudioEventListener("waiting", onAudioWaiting)}
	function scheduleStartEvent() {addAudioEventListener("playing", onAudioPlaying)}	//must be added after audio.play called, otherwise audio.play will trigger it
	function scheduleEndEvent() {
		addAudioEventListener("ended", sendEndEvent);
		addAudioEventListener("pause", sendEndEvent);
	}

	/** add events through this function so we can remove eventListeners later - to make sure GC collects the audio */
	function addAudioEventListener(event,listener) {
		audioEventListeners.push({event:event, listener:listener});
		audio.addEventListener(event,listener);
	}

	function removeExternalEventListener() {externalEventListener = function(event){}}	//so no error is raised

	function anyError() {
		return !audio.src || errorFlag;	//TODO chck if audio.src needed - it means the requestNext logic failed in the previous audio
	}
	function sendErrorEvent() {externalEventListener({type:"error"})};

	function pauseAudio() {audio.pause()}
	function removeAudioEvenetListeners() {
		audioEventListeners.forEach(function(eventListener) {audio.removeEventListener(eventListener.event,eventListener.listener)});
		audioEventListeners = [];
	}
	function removeAudioSrc() {audio.src = ""}	//to make sure GC happens

	function onAudioWaiting() {externalEventListener({type:"loading"})};
	function onAudioPlaying() {externalEventListener({type:"playing"})};
	function sendEndEvent() {externalEventListener({type:"end"})};
	function onAudioError() {
		setErrorFlag();
		if(playRequestedFlag) sendErrorEvent();
	}
	
	function onAudioCanPlayThrough() {
		setLoadingSeconds();
		addAudioTimeReachedListener(getRequestNextAudioTime, sendRequestNextEvent);
	}

	function pauseAudio() {audio.pause()};

	function getRequestNextAudioTime() {return audio.duration - 2*loadingSeconds*audio.playbackRate};	//TODO instead of audio.duration use lastWordEndTime
	function sendRequestNextEvent() {externalEventListener({type:"requestNext"})};

	function setErrorFlag() {errorFlag = true};
	var errorFlag = false;

	function setPlayRequestedFlag() {playRequestedFlag = true};
	var playRequestedFlag = false;

	function setHttpRequestSentTime() {httpRequestSentTime = Date.now()};
	var httpRequestSentTime;

	function setLoadingSeconds() {loadingSeconds = (Date.now() - httpRequestSentTime) / 1000.0};
	var loadingSeconds;

	// =================================== marker events ===================================
	function requestMarkers() {
		var url = UrlBuilder.build({text:c.text, iSpeechVoice:c.iSpeechVoice, action:"markers"});
		Http.get({url:url, success:onMarkersReceived});
	}
	
	function onMarkersReceived(iSpeechMarkersXmlString) {
		var wordTimeMarkers = getWordTimeMarkers(iSpeechMarkersXmlString);
		if(c.scheduleMarkers) scheduleMarkers(wordTimeMarkers);

		var lastWordEndTime = wordTimeMarkers[wordTimeMarkers.length-1].end;
		schedulePromoCutOff(lastWordEndTime);
		//TODO start playing only when markers are ready
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
				,text:			word
			});
		}
	}

	/** @param marker {startTime,startOffset,endTime,endOffset */
	function scheduleMarkerEvent(marker) {
		addAudioTimeReachedListener(
			function() {return marker.startTime / 1000;}
			,function() {externalEventListener({type:"playing",startOffset:marker.startOffset,endOffset:marker.endOffset,text:marker.text})}
		);
		addAudioTimeReachedListener(
			function() {return marker.endTime / 1000}
			,function() {externalEventListener({type:"playing"})}
		);
	}

	function schedulePromoCutOff(lastWordEndTime) {
		addAudioTimeReachedListener(function() {return lastWordEndTime/1000}, pauseAudio);
	}
	
	/** @return array of {start, end} objects with the starting/ending times of words */
	function getWordTimeMarkers(iSpeechMarkersXmlString) {
		var startEndTimeNodes = (new DOMParser()).parseFromString(iSpeechMarkersXmlString, "text/xml").getElementsByTagName('word');

		var result = [];
		for(var i=0; i<startEndTimeNodes.length; i++) {
			var marker = {};
			marker.start = parseInt(startEndTimeNodes[i].getElementsByTagName('start')[0].innerHTML);
			marker.end = parseInt(startEndTimeNodes[i].getElementsByTagName('end')[0].innerHTML);
			marker.word = startEndTimeNodes[i].getElementsByTagName('text')[0].innerHTML
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
	function popWordPositionItem(wordPositions, word) {
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
	var externalEventListener = function(){};

	var audioEventListeners = [];
}
});
