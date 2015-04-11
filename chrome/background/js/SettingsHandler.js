/** setters and getters for settings - persistence is also provided by chrome.storage.local*/
define([], function() {
	var cache = null;
	
	// ========================================== public ==========================================
	var settingsHandler = {};
	
	/** async read of settings
	 * @param response is executed when settings are cached. there will be 1 parameter: the cache object TODO clone it
	 * if no settings are persisted, it persists a default one */
	settingsHandler.getAll = function(response) {
		//we already cached the settings
		if(cache != null) {
			response(cache);
			return;
		}
		
		//we have not cached => lets cache
		chrome.storage.local.get('ClickAndSpeechSettings', function(items) {
			cache = items.ClickAndSpeechSettings;
			if(cache) {	//=> there are settings persisted
				response(cache);
				return;
			}

			//settings are not persisted (first ever execution)
			cache = {
				turnedOn:true
				,selectEvent:"hoveredParagraph"
				,readOnClick:true
				,readOnSpace:true
				,tts:"iSpeech"
				,gender:"female"
				,speed:1
			}
			response(cache);
			chrome.storage.local.set({ClickAndSpeechSettings:cache}, function() {
				console.log("first ever execution: default settings persisted");
			});
		});
	}
	
	/** persists given setting */
	settingsHandler.set = function(setting, value) {
		settingsHandler.getAll(function(cache) {
			cache[setting] = value;
			chrome.storage.local.set({ClickAndSpeechSettings:cache}, function() {});
		});
	}

	return settingsHandler;
});