/** manages several tts services:
 * 1. provides the option to choose
 * 2. handles errors in them
 */
define(["GoogleTts", "ISpeechTts"], function(googleTts, iSpechTts) {
	var ttsArray = [googleTts, iSpechTts];
	var activeTts = googleTts;
	
	var onStart = function() {};	//executed whenever any of the tts services start reading
	var onEnd = function() {};	//executed whenever any of the tts services stop reading
	var onError = function(url) {};	//executed whenever any of the tts services fails to read
	
	// =============================== public ===============================
	var provider = {
		get serviceNames() {
			var result = [];
			ttsArray.forEach(function(tts) {result.push(tts.name);});
			return result;
		}
		,set onStart(callback) {onStart = callback;}
		,set onEnd(callback) {onEnd = callback;}
		,set onError(callback) {onError = callback;}
		,set preferredTts(name) {
			ttsArray.forEach(function(tts) {
				if(tts.name == name) activeTts = tts;	//TODO error handling
			});
		}
	};
	
	//all services onStart should execute our onStart
	ttsArray.forEach(function(tts) {tts.onStart = function(){onStart();}});
	ttsArray.forEach(function(tts) {tts.onEnd = function(){onEnd();}});
	ttsArray.forEach(function(tts) {tts.onError = function(url){
		console.log("error from " + activeTts.name + ": " + url);
		onError(activeTts.name, url);}
	});
	
	provider.read = function(c) {activeTts.read(c);}
	provider.stop = function() {activeTts.stop();}
	
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