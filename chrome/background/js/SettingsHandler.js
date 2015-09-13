/** setters and getters for settings - persistence is also provided by chrome.storage.local*/
define([], function() {
	var availableSettings = ["turnedOn","hoverSelect","arrowSelect","browserSelect","tts","gender","speed"];
	var defaultValues = {
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
	 * @param settingsResponse is called with the settings object
	 * @param defaultsResponse is called with the settings for which defaults are being persisted (if any)
	 * if no settings stored (first ever execution) it persists the default values */
	settingsHandler.getAll = function(settingsResponse, defaultsResponse) {
		chrome.storage.local.get(availableSettings, function(storedSettings) {
			var result = {};
			var defaults = null;
			availableSettings.forEach(function(name) {
				//there is value for the setting
				if(storedSettings[name]) {
					result[name] = storedSettings[name].value;
					return;
				}

				//there is no value for it
				if(!defaults) defaults = {};
				defaults[name] = defaultValues[name];

				result[name] = defaultValues[name];
				settingsHandler.set(name, result[name]);
			});
			settingsResponse(result);
			if(defaultsResponse && defaults) defaultsResponse(defaults);
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
