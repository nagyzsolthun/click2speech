/** manages several tts services:
 * 1. provides the option to choose
 * 2. handles errors in them
 */
define(["GoogleTts", "ISpeechTts"], function(googleTts, iSpechTts) {
	var ttsArray = [googleTts, iSpechTts];
	var activeTts = null;
	
	var speed = 1;
	var onLoading = function() {};	//executed when loading starts
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
		,set speed(value) {
			speed = value;
			activeTts.speed = speed; //in case rading is going on TODO check if setting is available
		}
		,set onLoading(callback) {onLoading = callback;}
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
			activeTts.stop();
			onEnd();
			return;
		}
		activeTts.read({
			text: c.text
			,lan: c.lan
			,speed: speed
			,onLoading: function(){onLoading();}
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