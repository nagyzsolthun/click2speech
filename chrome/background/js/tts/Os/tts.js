define(["tts/Os/Speech"], function(Speech) {
	
	// =================================== public ===================================
	var reader = {
		get name() {return "OsTts";}
		,get properties() {return ["speed"];}
	}
	
	/** @return a speech object set up to read given text
	 * @param c.text the text to read
	 * @param c.startIndex optional parameter, reading starts from this index (error recovery)
	 * @param c.lan the language of the text*/
	reader.prepare = function(c) {
		return new Speech(c);
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
