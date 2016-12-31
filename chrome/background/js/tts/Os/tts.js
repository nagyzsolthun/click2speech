define(["tts/Os/Speech"], function(Speech) {
	
	// =================================== public ===================================
	var tts = {
		get name() {return "OsTts";}
		,get properties() {return ["speed"];}
	}
	
	/** @return a speech object set up to read given text
	 * @param c.text the text to read
	 * @param c.startIndex optional parameter, reading starts from this index (error recovery)
	 * @param c.lan the language of the text*/
	tts.prepare = function(c) {
		return new Speech(c);
	}
	
	/** @param callback called with a boolean flag indicating if the test passed */
	tts.test = function(callback) {
		var result;
		chrome.tts.getVoices(function(voices) {
			var nativeVoices = voices.filter(function(voice) {
				return voice.voiceName == "native";	//these (this) seem to be the TTS built in the OS
			});
			callback(nativeVoices.length > 0);
		});
	}
	
	/** @return true if @param lan is any dialect of English
	 * tested on Windows7: only English is supported
	 * other voiceNames than "native" use GoogleTts in the background, and just stop playing after 100 characters are reached */
	tts.supportedLanguage = function(lan) {
		return lan.match(/en.*/);
	}

	return tts;
});
