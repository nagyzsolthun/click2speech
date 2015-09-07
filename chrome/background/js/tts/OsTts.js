define([], function() {
	/** constructs a new OsSpeech isntance
	* @param c.text the text to be read
	* @param c.lan the language of reading*/
	function OsSpeech(c) {
		var voice = null;
		var onVoiceAvailable = function() {}	//called when voice is found
		var onEvent = function() {};
		
		this.play = function() {
			//tested on Windows7: only English is supported
			//other voiceNames than "native" use GoogleTts in the background, and just stop playing after 100 characters are reached
			if(! c.lan.match(/en.*/)) {
				onEvent({type:"error",errorType:"LANGUAGE",remaining:c.text});
				return;
			}
			chrome.tts.speak(c.text,{
				voiceName: "native"
				,onEvent: function(event) {
					switch(event.type) {
						case("start"):		onEvent({type:"start"}); break;
						case("end"):		onEvent({type:"end"}); break;
						case("interrupted"):onEvent({type:"end"}); break;
						case("error"):		onEvent({type:"error",errorType:"NOT_SUPPORTED",remaining:c.text}); break;
					}
				}
			});
			onEvent({type:"loading"});
		}
		
		/** stops playing - NO event is fired */
		this.stop = function() {
			onEvent = function() {};
			chrome.tts.stop();
		}
		
		Object.defineProperty(this, 'tts', {get: function() {return reader.name;}});
		Object.defineProperty(this, 'onEvent', {set: function(callback){onEvent = callback;}});
		
	}
	
	// =================================== public ===================================
	var reader = {
		get name() {return chrome.i18n.getMessage("OsTts") || "*OsTts*";}
		,get properties() {return [];}
	}
	
	/** @return a speech object set up to read given text
	 * @param c.text the text to read
	 * @param c.lan the language of the text*/
	reader.prepare = function(c) {
		return new OsSpeech(c);
	}
	
	/** @param callback called with a boolean flag indicating if the test passed */
	reader.test = function(callback) {
		var result;
		chrome.tts.getVoices(function(voices) {
			var nativeVoices = voices.filter(function(voice) {
				return voice.voiceName == "native";	//these (this) seem to be the TTS built in the OS
			});
			callback(nativeVoices.length > 0);
		});
	}

	return reader;
});
