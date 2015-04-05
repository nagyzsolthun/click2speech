/** manages several tts services:
 * 1. provides the option to choose
 * 2. handles errors in them
 */
define(["tts/GoogleTts", "tts/ISpeechTts", "tts/OsTts"], function(googleTts, iSpechTts, OsTts) {
	var ttsArray = [googleTts, iSpechTts, OsTts];
	var preferredTts = null;
	
	//when any tts starts reading, it provides a speech object
	var speech = null;
	
	/** called when event occours its parameter is the event
	 * @param event.type the type of the event [loading,start,end,error]
		* 	@param event.errorType in case of error event, the type, typically URL_ERROR
		* 	@param event.url in case of URL_ERROR, the url that caused the error*/
	var onEvent = function() {};
	
	/** @return a tts that is not in the usedTtsArr*/
	function nextTts(usedTtsArr) {
		var result = null;
		ttsArray.forEach(function(tts) {
			if(result) return;	//we return the first match
			if(usedTtsArr.indexOf(tts) < 0) result = tts;
		});
		return result;
	}
	
	/** reads given text
	 * if prefferred tts is not able to read it, uses another one
	 * @param c.usedTtsArr
	 * @param c.text
	 * @param c.lan
	 * @param c.speed*/
	function read(c) {
		if(speech) speech.stop();
		if(!c.text) return;
		
		var tts = nextTts(c.usedTtsArr);
		speech = tts.prepare({text:c.text, lan:c.lan, speed:c.speed});
		speech.onEvent = function(event) {
			switch(event.type) {
				case("error"):
					onEvent({tts:speech.tts,type:event.type,errorType: event.errorType,url: event.url});
					read({usedTtsArr: c.usedTtsArr.concat(tts),text:event.remaining,lan:c.lan,speed:c.speed});
					break;
				case("loading"):
				case("start"):
				case("end"): onEvent({type:event.type}); break;
				default: console.log("unkown event type: " + event.type); break;
			}
		}
		
		speech.play();
	}
	
	// =============================== public ===============================
	var provider = {
		get serviceNames() {
			var result = [];
			ttsArray.forEach(function(tts) {result.push(tts.name);});
			return result;
		}
		,set speed(value) {
			speed = value;
			if(speech) speech.speed = speed; //in case rading is going on TODO check if setting is available
		}
		,set onEvent(callback) {onEvent = callback;}
		,set preferredTts(name) {
			ttsArray.forEach(function(tts) {
				if(tts.name == name) preferredTts = tts;	//TODO error handling
			});
		}
	};
	
	/** reads text
	 * if prefferred tts is not able to read it, uses another one
	 * @param c.text
	 * @param c.lan
	 * @param c.speed*/
	provider.read = function(c) {
		read({usedTtsArr:[],text: c.text,lan: c.lan,speed: c.speed});
	}
	provider.stop = function() {
		speech.stop(onEnd);
	}
	
	/** @param callback is called when a tts is tested
	 * 		@param available true if test passed, false if failed */
	provider.test = function(name, callback) {
		ttsArray.forEach(function(tts) {
			if(tts.name == name) tts.test(callback);
		});
	}


	console.log("ttsProvider initialized");
	return provider;
});