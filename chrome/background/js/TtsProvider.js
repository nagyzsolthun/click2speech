/** manages several tts services:
 * 1. provides the option to choose
 * 2. handles errors in them
 */
define(["GoogleTts", "ISpeechTts"], function(googleTts, iSpechTts) {
	var ttsArray = [googleTts, iSpechTts];
	var activeTts = googleTts;
	
	// =============================== public ===============================
	var provider = {
		get serviceNames() {
			var result = [];
			ttsArray.forEach(function(tts) {result.push(tts.name);});
			return result;
		}
		,set preferredTts(name) {
			ttsArray.forEach(function(tts) {
				if(tts.name == name) activeTts = tts;	//TODO error handling
			});
		}
	};
	
	provider.read = function(c) {activeTts.read(c);}
	provider.stop = function() {activeTts.stop();}
	
	/** all settings are set through this function
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