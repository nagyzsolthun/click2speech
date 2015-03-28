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
		* @param c.onLoading called when loading started
		* @param c.onStart called when audio starts playing
		* @param c.onEnd called when playing finishes
		* @param c.onError called when error has raised
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
						case("error"):		c.onError(); break;	//TODO reason
						case("start"):		c.onStart(); break;
						case("end"):		c.onEnd(); break;
						case("interrupted"):c.onEnd(); break;
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