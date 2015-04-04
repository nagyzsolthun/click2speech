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
				onEvent({type:"error",errorType:"LANGUAGE"});	//TODO remaning
				return;
			}
			chrome.tts.speak(c.text,{
				voiceName: "native"
				,onEvent: function(event) {
					switch(event.type) {
						case("start"):		onEvent({type:"start"}); break;
						case("end"):		onEvent({type:"end"}); break;
						case("interrupted"):onEvent({type:"end"}); break;
						case("error"):		onEvent({type:"error",errorType:"UNKOWN"}); break;	//TODO reason+remaning
					}
				}
			});
		}
		
		this.stop = function() {
			chrome.tts.stop();
		}
		
		Object.defineProperty(this, 'tts', {get: function() {return reader.name;}});
		Object.defineProperty(this, 'onEvent', {set: function(callback){onEvent = callback;}});
		
	}
	
	// =================================== public ===================================
	var reader = {get name() {return "Operating System";}}
	
	/** @return a speech object set up to read given text
	 * @param c.text the text to read
	 * @param c.lan the language of the text*/
	reader.prepare = function(c) {
		return new OsSpeech(c);
	}
	
	/** @param callback called with a boolean flag indicating if the test passed */
	reader.test = function(callback) {
		chrome.tts.getVoices(function(voices) {
			if(voices.indexOf("native") < 0) callback(false)
			else callback(true);
		});
	}

	console.log("OsTts initialized");
	return reader;
});