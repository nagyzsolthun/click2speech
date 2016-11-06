define(["tts/WordPositionFinder"], function(WordPositionFinder) {
/** constructs a new OsSpeech isntance
 * @param c.text the text to be read
 * @param c.speechId the global id of the speech
 * @param c.startIndex optional parameter, reading starts from this index (error recovery)
 * @param c.lan the language of reading*/
return function(c) {
	this.play = function() {
		//tested on Windows7: only English is supported
		//other voiceNames than "native" use GoogleTts in the background, and just stop playing after 100 characters are reached
		if(! c.lan.match(/en.*/)) {
			externalEventListener({speechId:c.speechId, type:"error",errorType:"LANGUAGE",remaining:c.text});
			return;
		}

		var text = c.text.substring(startIndex, c.length)
		wordPositions = WordPositionFinder.getPositions(text);
		wordWordStartOffset2word = getWordStartOffset2word();

		chrome.tts.speak(text,{
			voiceName: "native"
			,rate: c.speed
			,onEvent: function(event) {
				var listener = ttsEventListeners[event.type];
				if(listener) listener(event);
			}
		});
		externalEventListener({speechId:c.speechId, type:"loading"});
	}

	/** stops playing */
	this.stop = function() {
		externalEventListener = function() {};
		chrome.tts.stop();
		externalEventListener({speechId:c.speechId, type:"end"});
	}
	
	Object.defineProperty(this, 'tts', {get: function() {return reader.name;}});
	Object.defineProperty(this, 'onEvent', {set: function(callback){externalEventListener = callback}});

	// =================================== private ===================================

	var startIndex = c.startIndex || 0;

	var wordPositions;
	var wordWordStartOffset2word;

	function getWordStartOffset2word() {
		var result = {};
		wordPositions.forEach(function(wordPosition) {
			result[wordPosition.start] = wordPosition.word;
		});
		return result;
	}

	var ttsEventListeners = {};
	ttsEventListeners.start = function() {externalEventListener({speechId:c.speechId, type:"playing"});}
	ttsEventListeners.end = function() {externalEventListener({speechId:c.speechId, type:"end"})}
	ttsEventListeners.interrupted = function() {externalEventListener({speechId:c.speechId, type:"end"})}
	ttsEventListeners.error = function() {externalEventListener({speechId:c.speechId, type:"error",errorType:"NOT_SUPPORTED",index:0})}
	ttsEventListeners.word = function(event) {
		var word = wordWordStartOffset2word[event.charIndex];
		if(! word) return;	//in case our word recognition logic is different than the one in Chrome
		var startOffset = startIndex + event.charIndex;
		var endOffset = startOffset + word.length;
		externalEventListener({speechId:c.speechId, type:"playing", startOffset:startOffset, endOffset:endOffset, text:word});
	}

	var externalEventListener = function() {};
}
});
