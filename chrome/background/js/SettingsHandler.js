/** setters and getters for settings - persistence is also provided by chrome.storage.local*/
define([], function() {
	var availableSettings = ["turnedOn","hoverSelect","arrowSelect","browserSelect","tts","gender","speed"];
	var defaults = {
		turnedOn:true
		,hoverSelect:true
		,arrowSelect:true
		,browserSelect:false
		,tts:"iSpeech"
		,gender:"female"
		,speed:1.2
	};
	
	chrome.storage.local.remove(["settings","setting2timestamp","setting2version","createTimestamp","createVersion"]);	//TODO remove this once all migrated

	/** provides some metadata for a value */
	function Setting(value) {
		this.value = value;
		this.timestamp = Date.now();
		this.version = chrome.app.getDetails().version;
	};

	// =================================== public ===================================
	var settingsHandler = {};
	
	/** async read of settings
	 * @param response is called with the settings object
	 * if no settings stored (first ever execution) it persists the default values */
	settingsHandler.getAll = function(response) {
		chrome.storage.local.get(availableSettings, function(storedSettings) {
			var result = {};
			availableSettings.forEach(function(name) {
				//there is value for the setting
				if(storedSettings[name]) {
					result[name] = storedSettings[name].value;
					return;
				}

				//there is no value for it
				result[name] = defaults[name]
				console.log("persisting default value for " + name + ":" + result[name] + "...");
				settingsHandler.set(name, result[name]);
			});
			response(result);
		});
	}
	
	/** persists given setting */
	settingsHandler.set = function(setting, value) {
		chrome.storage.local.get(setting, function(storedSettings) {
			if(storedSettings[setting] && storedSettings[setting].value == value) return;
			
			var setting2value = {};
			setting2value[setting] = new Setting(value);
			chrome.storage.local.set(setting2value);
		});
	}

	return settingsHandler;
});
