/** manages several tts services:
 * 1. provides the option to choose
 * 2. handles errors in them
 */
define(["SettingsHandler","tts/iSpeech/tts","tts/Watson/tts","tts/Os/tts"], function(settingsHandler, iSpeechTts, WatsonTts, OsTts) {
	
	var provider = {
		get ttsProperties() {return ttsArray.map(function(tts) {return {name:tts.name,properties:tts.properties}})}
		,set speed(value) {if(speech) speech.speed = value;}	//in case speed changes while reading TODO, check if available
		,set onEvent(callback) {onEvent = callback || function(){};}
	};
	
	/** reads text; if prefered tts is not able to read it, uses another one */
	provider.read = function(c) {
		if(speech) speech.stop();
		settingsHandler.getAll(function(settings) {
			var preferedTts = ttsArray.filter(function(tts) {return tts.name == settings.tts})[0] || OsTts;
			read({
				speechId: c.speechId
				,text:c.text
				,lan:c.lan
				,scheduleMarkers:c.scheduleMarkers
				,speed:settings.speed
				,gender:settings.gender
				,errors:[]
				,preferedTts:preferedTts
			});
		});
	}
	
	/** @param callback is called when a tts is tested
	 * 	@param available true if test passed, false if failed */
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
	 * @param c.errors	the errors raised by previous trials
	 */
	function read(c) {
		var tts = getNoErrorTts(c.preferedTts, c.errors);
		if(!tts) {	//no more usable tts
			onEvent({speechId:c.speechId, type:"error"});
			return;
		}
		
		speech = tts.prepare(c);
		if(!speech) {
			read({
				speechId:c.speechId
				,text:c.text
				,lan:c.lan
				,scheduleMarkers: c.scheduleMarkers
				,speed:c.speed
				,gender:c.gender
				,startIndex:0
				,errors:c.errors.concat(tts.name)
			});
			return;
		}

		speech.onEvent = function(event) {
			lastEvent = event;
			switch(event.type) {
				case("loading"):
				case("playing"):
					onEvent(event);
					break;
				case("end"):
					speech = null;
					onEvent(event);
					break;
				case("error"):
					read({
						speechId:c.speechId
						,text:c.text
						,lan:c.lan
						,scheduleMarkers: c.scheduleMarkers
						,speed:c.speed
						,gender:c.gender
						,startIndex:event.remainingStartIndex
						,errors:c.errors.concat(tts.name)
					});
					break;
			}
		}
		speech.play();
	}
	
	/** @return first TTS that raised NO error - preferedTts is priority */
	function getNoErrorTts(preferedTts, errors) {
		if(preferedTts && !errors.includes(preferedTts.name)) return preferedTts;
		else return ttsArray.filter(function(tts) {return !errors.includes(tts.name)})[0];
	}
	
	var ttsArray = [WatsonTts, OsTts];
	var speech = null;	//when any tts starts reading, it provides a speech object
	var onEvent = function() {};	//speech events @param event.type is loading|playing|end|error

	return provider;
});
