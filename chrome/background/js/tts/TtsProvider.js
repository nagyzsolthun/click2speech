/** manages several tts services:
 * 1. provides the option to choose
 * 2. handles errors in them
 */
define(["SettingsHandler","tts/iSpeech/tts","tts/Watson/tts","tts/Os/tts"], function(settingsHandler, iSpechTts, WatsonTts, OsTts) {
	
	var provider = {
		get ttsProperties() {
			return ttsArray.map(function(tts) {
				return {name:tts.name,properties:tts.properties};
			});
		}
		,get errors() {return errors;}
		,get lastEvent() {return lastEvent;}
		,set speed(value) {if(speech) speech.speed = value;}	//in case speed changes while reading TODO, check if available
		,set onEvent(callback) {onEvent = callback || function(){};}
	};
	
	/** reads text
	 * if prefered tts is not able to read it, uses another one
	 * @param c.speechId
	 * @param c.text
	 * @param c.lan
	 * @param c.scheduleMarkers */
	provider.read = function(c) {
		settingsHandler.getAll(function(settings) {
			//new reading => no error
			errors = [];
			
			//set up prefered tts
			ttsArray.forEach(function(tts) {if(tts.name == settings.tts) preferedTts = tts;});
			
			//read
			read({
				speechId: c.speechId
				,text:c.text
				,lan:c.lan
				,scheduleMarkers:c.scheduleMarkers
				,speed:settings.speed
				,gender:settings.gender
			});
		});
	}
	
	/** @param callback is called when a tts is tested
	 * 		@param available true if test passed, false if failed */
	provider.test = function(name, callback) {
		ttsArray.forEach(function(tts) {
			if(tts.name == name) tts.test(callback);
		});
	}
	
	// =============================== private ===============================
	
	/** reads given text
	 * if prefered tts is not able to read it, uses another one
	 * @param c.id
	 * @param c.text
	 * @param c.lan
	 * @param c.scheduleMarkers
	 * @param c.speed
	 * @param c.gender
	 */
	function read(c) {
		var tts = nextTts();	//errors must be prepared
		if(! tts) {	//no more usable tts
			onEvent({speechId:c.speechId, type:"error"});
			return;
		}
		
		if(speech) speech.stop();

		speech = tts.prepare(c);
		speech.onEvent = function(event) {
			lastEvent = event;
			switch(event.type) {
				case("error"):
					speech = null;
					errors.push({ttsName:tts.name,type:event.errorType});
					read({
						speechId:c.speechId
						,text:c.text
						,startIndex:event.remainingStartIndex
						,lan:c.lan
						,scheduleMarkers: c.scheduleMarkers
						,speed:c.speed
						,gender:c.gender});
					break;
				case("loading"):
				case("playing"):
					onEvent(event);
					break;
				case("end"):
					speech = null;
					onEvent(event);
					break;
			}
		}
		speech.play();	//fires event
	}
	
	/** @return a tts that has not yet raised an error*/
	function nextTts() {
		if(! hasRaisedError(preferedTts)) return preferedTts;
		
	   var result = null;
		ttsArray.forEach(function(tts) {
			if(result) return;	//we return the first match
			if(! hasRaisedError(tts)) result = tts;
		});
		return result;
	}
	
	/** @return true if errors contains any error from given tts */
	function hasRaisedError(tts) {
		var result = false;
		errors.forEach(function(error) {
			if(error.ttsName == tts.name) result = true;
		});
		return result;
	}
	
	var ttsArray = [iSpechTts, WatsonTts, OsTts];
	var preferedTts = iSpechTts;	//TODO maybe remove this. added here, because GoogleTts was removed
	
	//when any tts raises an error, it is put to this array
	//{ttsName,errorType} array
	var errors = [];
	
	var lastEvent = null;
	
	//when any tts starts reading, it provides a speech object
	var speech = null;
	
	/** called when event occours its parameter is the event
	 * @param event.type the type of the event [loading,start,end,error]
		* 	@param event.errorType in case of error event, the type, typically URL_ERROR */
	var onEvent = function() {};

	return provider;
});
