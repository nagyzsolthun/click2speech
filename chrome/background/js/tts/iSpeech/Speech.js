/** speech for for text that fits in 1 tts request */
define(["tts/iSpeech/SpeechPart", "tts/TextSplitter", "tts/WordPositionFinder"], function(SpeechPart,TextSplitter,WordPositionFinder) {

/** @param c.text
 * @param c.speechId the global id of speech
 * @param c.startIndex optional parameter, reading starts from this index - used when speech is used for error recovery
 * @param c.iSpeechVoice
 * @param c.speed
 * @param c.scheduleMarkers */
return function(c) {

	// =================================== init ===================================
	var text = c.text.substring(c.startIndex || 0, c.length);
	var wordPositions = WordPositionFinder.getPositions(text);
	var speechPartArr = createSpeechPartArr();

	sendHttpRequestOfSpeechPart(0);

	var creationTime = Date.now();

	// =================================== public ===================================

	Object.defineProperty(this, 'onEvent', {set: function(onEvent) {
		externalEventListener = onEvent;
	}});
	Object.defineProperty(this, 'speed', {set: function(speed) {
		speechPartArr.forEach(function(part) {part.speed = speed});
	}});
	Object.defineProperty(this, 'tts', {get: function() {
		return "iSpeech";
	}});
	this.play = function() {
		playSpeechPart(0);
	};
	this.stop = function() {
		speechPartArr.forEach(function(speechPart) {speechPart.stop()});
		externalEventListener({speechId:c.speechId,type:"end"});
	};
	
	// =================================== private ===================================
	/** @return array of SpeechParts that play text using c.iSpeechVoice */
	function createSpeechPartArr() {
		if(!wordPositions.length) return [];	//e.g. if the text is only a space character, we consider it empty
		var textArr = TextSplitter.split({text:text,testLength: isWordCountUnderLimit});
		var result = textArr.map(function(text) {
			return new SpeechPart({text:text,iSpeechVoice:c.iSpeechVoice,scheduleMarkers:c.scheduleMarkers});
		});
		result.forEach(function(speechPart) {speechPart.speed = c.speed});
		return result;
	}

	function isWordCountUnderLimit(startIndex,endIndex) {
		var wordCounter = wordPositions.filter(function(wordPosition) {
			return wordPosition.start < endIndex && wordPosition.end > startIndex;
		}).length;
		const WORD_COUNT_LIMIT = 30;
		return wordCounter <= WORD_COUNT_LIMIT;
	}

	/** plays speechpart on @param index index and schedules the httpRequests + plays the next speechPart item */
	function playSpeechPart(speechPartIndex) {
		var speechPart = speechPartArr[speechPartIndex];
		if(!speechPart) {
			externalEventListener({speechId:c.speechId,type:"end"});
			return;
		}
		var eventListeners = createEventListeners(speechPartIndex);
		speechPart.onEvent = function(event) {
			eventListener = eventListeners[event.type];
			if(eventListener) eventListener(event);
		}

		speechPart.play();
	}

	function sendHttpRequestOfSpeechPart(speechPartIndex) {
		var speechPart = speechPartArr[speechPartIndex];
		if(speechPart) speechPart.sendHttpRequests();
	}

	function createEventListeners(speechPartIndex) {
		var result = {};
		result.loading = function() {externalEventListener({speechId:c.speechId,type:"loading"})};
		result.playing = function(event) {
			var startOffset = getAbsoluteOffset(speechPartIndex,event.startOffset);
			var endOffset = getAbsoluteOffset(speechPartIndex,event.endOffset);
			externalEventListener({speechId:c.speechId,type:"playing",text:event.text,startOffset:startOffset,endOffset:endOffset});
		};
		result.end = function() {playSpeechPart(speechPartIndex+1)};
		result.requestNext = function() {sendHttpRequestOfSpeechPart(speechPartIndex+1)}
		result.error = function() {
			var remainingStartIndex = getAbsoluteOffset(speechPartIndex, 0);
			externalEventListener({speechId:c.speechId,type:"error", errorType: "URL_ERROR", remainingStartIndex: remainingStartIndex});
		}
		return result;
	}

	/** @return character position in speechPart relative to whole speech */
	function getAbsoluteOffset(speechPartIndex, relativeOffset) {
		var startIndex = c.startIndex || 0;
		var result = 0;
		for(var i=0; i<speechPartIndex; i++) {
			result += speechPartArr[i].text.length;
		}
		return startIndex+result+relativeOffset;
	}

	var externalEventListener = function(event) {};
}
});
