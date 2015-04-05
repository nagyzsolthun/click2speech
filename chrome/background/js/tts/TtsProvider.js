/** manages several tts services:
 * 1. provides the option to choose
 * 2. handles errors in them
 */
define(["SettingsHandler", "tts/GoogleTts", "tts/ISpeechTts", "tts/OsTts"], function(settingsHandler, googleTts, iSpechTts, OsTts) {
	var ttsArray = [googleTts, iSpechTts, OsTts];
	var preferredTts = null;
	
	//when any tts raises an error, it is put to this array
	//{ttsName,errorType[,url]} array
	var errors = [];
	
	//when any tts starts reading, it provides a speech object
	var speech = null;
	
	/** called when event occours its parameter is the event
	 * @param event.type the type of the event [loading,start,end,error]
		* 	@param event.errorType in case of error event, the type, typically URL_ERROR
		* 	@param event.url in case of URL_ERROR, the url that caused the error*/
	var onEvent = function() {};
	
	/** @return true if errors contains any error from given tts */
	function hasRaisedError(tts) {
		var result = false;
		errors.forEach(function(error) {
			if(error.ttsName == tts.name) result = true;
		});
		return result;
	}
	
	/** @return a tts that has not yet raised an error*/
	function nextTts() {
		if(! hasRaisedError(preferredTts)) return preferredTts;
		
	   var result = null;
		ttsArray.forEach(function(tts) {
			if(result) return;	//we return the first match
			if(! hasRaisedError(tts)) result = tts;
		});
		return result;
	}
	
	/** reads given text
	 * if prefferred tts is not able to read it, uses another one
	 * @param c.text
	 * @param c.lan
	 * @param c.speed
	 * @param c.gender
	 */
	function read(c) {
		if(speech) speech.stop();

		var tts = nextTts();	//errors must be prepared
		if(! tts) return;	//no more usable tts

		speech = tts.prepare({text:c.text, lan:c.lan, speed:c.speed, gender:c.gender});
		speech.onEvent = function(event) {
			switch(event.type) {
				case("error"):
					errors.push({ttsName:tts.name,type:event.errorType,url:event.url});
					onEvent({type:"error"});	//TODO think about this
					read({text:event.remaining,lan:c.lan,speed:c.speed,gender:c.gender});
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
		get serviceNames() {return ttsArray.map(function(tts){return tts.name;});}
		,get errors() {return errors;}
		,set speed(value) {if(speech) speech.speed = value;}	//in case speed changes while reading TODO, check if available
		,set onEvent(callback) {onEvent = callback;}
	};
	
	/** reads text
	 * if prefferred tts is not able to read it, uses another one
	 * @param c.text
	 * @param c.lan*/
	provider.read = function(c) {
		settingsHandler.getAll(function(settings) {
			//new reading => no error
			if(c.text) errors = [];
			
			//set up preferred tts
			ttsArray.forEach(function(tts) {if(tts.name == settings.tts) preferredTts = tts;});
			
			//read
			read({
				text:c.text
				,lan:c.lan
				,speed:settings.speed
				,gender:settings.gender
			});
		});
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