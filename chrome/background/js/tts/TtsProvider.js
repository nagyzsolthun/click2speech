/** manages several tts services:
 * 1. provides the option to choose
 * 2. handles errors in them
 */
define(["tts/GoogleTts", "tts/ISpeechTts", "tts/OsTts"], function(googleTts, iSpechTts, OsTts) {
	var ttsArray = [googleTts, iSpechTts, OsTts];
	var activeTts = null;
	
	var speed = 1;
	
	/** called when event occours its parameter is the event
	 * @param event.type the type of the event [loading,start,end,error]
		* 	@param event.errorType in case of error event, the type, typically URL_ERROR
		* 	@param event.url in case of URL_ERROR, the url that caused the error*/
	var onEvent = function() {};
	
	// =============================== public ===============================
	var provider = {
		get serviceNames() {
			var result = [];
			ttsArray.forEach(function(tts) {result.push(tts.name);});
			return result;
		}
		,set speed(value) {
			speed = value;
			activeTts.speed = speed; //in case rading is going on TODO check if setting is available
		}
		,set onEvent(callback) {onEvent = callback;}
		,set preferredTts(name) {
			ttsArray.forEach(function(tts) {
				if(tts.name == name) activeTts = tts;	//TODO error handling
			});
		}
	};
	
	provider.read = function(c) {
		if(!c.text) {
			activeTts.stop();
			return;
		}
		activeTts.read({
			text: c.text
			,lan: c.lan
			,speed: speed
			,onEvent: function(event) {
				switch(event.type) {
					case("error"):
						onEvent({
							tts:activeTts.name	//TODO think about this delegation + handle the error
							,type:event.type
							,errorType: event.errorType
							,url: event.url
						});
						break;
					case("loading"):
					case("start"):
					case("end"): onEvent(event); break;
					default: console.log("unkown event type: " + event.type); break;
				}
				
			}
		});
	}
	provider.stop = function() {
		activeTts.stop(onEnd);
	}
	
	/** @param callback is called when a tts is tested
	 * 		@param c.success true if test passed, false if failed */
	provider.test = function(name, callback) {
		ttsArray.forEach(function(tts) {
			if(tts.name == name) tts.test(callback);
		});
	}


	console.log("ttsProvider initialized");
	return provider;
});