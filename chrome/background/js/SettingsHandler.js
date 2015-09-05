/** setters and getters for settings - persistence is also provided by chrome.storage.local*/
define([], function() {
	var availableSettings = ["turnedOn","hoverSelect","arrowSelect","browserSelect","tts","gender","speed", "settings"];	//TODO remove settings once migration done, only here to save old settings
	var defaults = {
		turnedOn:true
		,hoverSelect:true
		,arrowSelect:true
		,browserSelect:false
		,tts:"iSpeech"
		,gender:"female"
		,speed:1.2
	};
	
	chrome.storage.local.remove(["highlightSelect","builtInSelect","highlightOnArrows"]);	//remove deprecated TODO include settings, setting2timestamp, setting2version once migration is done

	/** provides some metadata for a value */
	function Setting(value) {
		this.value = value;
		this.timestamp = Date.now();
		this.version = chrome.app.getDetails().version;
	};
	
	function defaultValue(setting, storedSettings) {	//TODO remove 2nd param once migration done
		//old settings structure TODO remove this once migration done
		var oldSettings = storedSettings && storedSettings.settings;
		if(oldSettings) {
			console.log("old settings structure found, using it for " + setting);
			switch(setting) {
				case("hoverSelect"): return (oldSettings.selectType == "highlightSelect");
				case("arrowSelect"): return (oldSettings.selectType == "highlightSelect" && oldSettings.highlightOnArrows);
				case("browserSelect"): return (oldSettings.selectType != "highlightSelect");
				default: return oldSettings[setting];
			}
		}
		
		//no old select.. simple defaults
		return defaults[setting];
	}

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
				result[name] = defaultValue(name, storedSettings);	//TODO remove 2nd param once migration is done
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
