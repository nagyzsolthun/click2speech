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
	};
	/** @param callback is executed when the active tts changes with the following parameters (and when subscribed)
	 * 		@param c.active the name of the active tts
	 * 		@param c.availables the name of the available tts' (including the active one)
	 * 		@param c.unavailables the of the uavaiable tts'
	 */
	provider.subscribeOnChanges = function(callback) {
		return {
			active: [googleTts.name, iSpechTts.name]	//TODO..
		}
	}
	
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