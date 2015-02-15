/** manages several tts services:
 * 1. provides the option to choose
 * 2. handles errors in them
 */
define(["GoogleTts", "ISpeechTts"], function(googleTts, iSpechTts) {
	var ttsArray = [googleTts, iSpechTts];
	var activeTts = googleTts;
	
	var speed = 1;
	var onStart = function() {};	//executed whenever any of the tts services start reading
	var onEnd = function() {};	//executed whenever any of the tts services stop reading
	var onError = function(tts, url) {};	//executed whenever any of the tts services fails to read
	
	// =============================== public ===============================
	var provider = {
		get serviceNames() {
			var result = [];
			ttsArray.forEach(function(tts) {result.push(tts.name);});
			return result;
		}
		,set speed(value) {speed = value;}
		,set onStart(callback) {onStart = callback;}
		,set onEnd(callback) {onEnd = callback;}
		,set onError(callback) {onError = callback;}
		,set preferredTts(name) {
			ttsArray.forEach(function(tts) {
				if(tts.name == name) activeTts = tts;	//TODO error handling
			});
		}
	};
	
	provider.read = function(c) {
		if(!c.text) {
			activeTts.stop(onEnd);
			return;
		}
		activeTts.read({
			text: c.text
			,lan: c.lan
			,speed: speed
			,onStart: function(){onStart();}
			,onEnd: function(){onEnd();}
			,onError: function(url){
				console.log("error from " + activeTts.name + ": " + url);
				onError(activeTts.name, url);
			}
		});
	}
	provider.stop = function() {
		activeTts.stop(onEnd);
	}
	
	/** settings of reading are set through this function
	 * all tts' same function is executed - so if they dont implement e.g. to set speed, they just ignore the call
	 * @param setting the name if the setting
	 * @param value the value of the setting*/
	provider.set = function(setting, value) {
		ttsArray.forEach(function(tts) {
			tts.set(setting, value);
		});
	}

	console.log("ttsProvider initialized");
	return provider;
});