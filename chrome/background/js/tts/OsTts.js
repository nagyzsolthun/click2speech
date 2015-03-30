/** @return a WebAudioReader with set up buildUrlArr and getCutLength method to use Google TTS */
define([], function() {
	
	var reader = {get name() {return "Operating System";}}
	
	/** @return a voice that matches given params
	 * @param c.voices the vices from which ro select
	 * @param c.lan the language to match
	 * @param c.gender the gender to match TODO*/
	function getVoice(c) {
		for(var i=0; i<c.voices.length; i++) {
			if(c.voices[i].lang != c.lan) continue;
			//TODO gender
			return c.voices[i];
		}
		
		//no exact matct, try to find if a dialect matches
		for(var i=0; i<c.voices.length; i++) {
			if(! c.voices[i].lang.match(new RegExp(c.lan+"-.*"))) continue;
			//TODO gender
			return c.voices[i];
		}
	}
	
	/** reads given text on given language (stops playing if already is playing)
		* @param c.text the text to be read
		* @param c.lan the language of reading
		* @param c.speed the speed of reading (defaults to 1)
		* @param c.onEvent called when any event raised
		* 	@param event.type the type of the event [loading,start,end,error]
		* 	@param event.remaining the text that is not read in case of error
		*/
	reader.read = function(c) {
		chrome.tts.getVoices(function(voices) {
			var voice = getVoice({voices: voices, lan:c.lan});
			if(!voice) {
				c.onError();	//TODO reason
				return;
			}
			
			//TODO seems like text should be split
			chrome.tts.speak(c.text,{
				voiceName: voice.voiceName
				,onEvent: function(event) {
					switch(event.type) {
						case("start"):		c.oEvent({type:"start"}); break;
						case("end"):		c.oEvent({type:"end"}); break;
						case("interrupted"):c.oEvent({type:"end"}); break;
						case("error"):		c.oEvent({type:"error",errorType:"UNKOWN"}); break;	//TODO reason+remaning
					}
				}
			});
			
			c.onLoading();
		});
	}
	
	reader.stop = function() {
		chrome.tts.stop();
	}
	
	/** @param callback called with a boolean flag indicating if the test passed */
	reader.test = function(callback) {
		if(chrome.tts.isSpeaking()) {
			callback(true);
			return;
		}
		chrome.tts.speak(
			""
			,{
				onEvent: function(event) {
					if(event.type == "error") callback(false);
					else callback(true);
				}
			}
		);
	}

	console.log("OsTts initialized");
	return reader;
});