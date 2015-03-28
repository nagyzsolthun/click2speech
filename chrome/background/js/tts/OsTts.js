/** @return a WebAudioReader with set up buildUrlArr and getCutLength method to use Google TTS */
define([], function() {
	
	var reader = {get name() {return "Operating System";}}
	
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
		chrome.tts.speak(
			c.text
			,{
				lang: c.lan
				,onEvent: function(event) {
					console.log(event + " received");
				}
			}
			,function() {
				console.log("callback called");
			}
		);
	}
	
	/** @param callback called with a boolean flag indicating if the test passed */
	reader.test = function(callback) {
		callback(chrome.tts != null);
	}

	console.log("OsTts initialized");
	return reader;
});