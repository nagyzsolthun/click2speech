/** setters and getters for settings - persistence is also provided by chrome.storage.local*/
define(["tts/Os/tts","tts/iSpeech/tts"], function(OsTts,iSpeechTts) {
	
	var settingsHandler = {};
	
	/** async read of settings
	 * @param settingsResponse is called with the settings object
	 * @param defaultsResponse is called with the settings for which defaults are being persisted (if any)
	 * if no settings stored (first ever execution) it persists the default values */
	settingsHandler.getAll = function(settingsResponse, defaultsResponse) {
		chrome.storage.local.get(null, function(storedSettings) {

			// convert name->Setting to name->value map
			var result = {};
			for(var name in storedSettings) {
				result[name] = storedSettings[name].value;
			}

			// check if any setting is not set
			var namesToSetUp = nonStoredSettingNames(result);
			if(!namesToSetUp.length) {
				settingsResponse(result);
				return;
			}

			// set up missing settings..
			var valuesToSetUp = [];
			for(var i=0; i<namesToSetUp.length; i++) {
				valuesToSetUp[i] = defaultValues[namesToSetUp[i]];
			}

			// wait until all non-stored settings promise returns
			Promise.all(valuesToSetUp).then(function(values) {
				var defaults = {};
				for(var i=0; i<values.length; i++) {
					var name = namesToSetUp[i];
					var value = values[i];
					settingsHandler.set(name, value);
					result[name] = value;
					defaults[name] = value;
				}
				settingsResponse(result);
				if(defaultsResponse) defaultsResponse(defaults);
			});
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

	// =================================== private ===================================

	function nonStoredSettingNames(storedSettings) {
		var result = [];
		for(name in defaultValues) {
			if(! (name in storedSettings)) result.push(name);
		}
		return result;
	}
	
	var defaultValues = {
		turnedOn: true
		,hoverSelect: true
		,arrowSelect: false
		,browserSelect: false
		,tts: new Promise(function(resolve,reject) {
			OsTts.test(function(result) {resolve(result ? OsTts.name : iSpeechTts.name)});
		})
		,gender: "female"
		,speed: 1.2
	};

	/** provides some metadata for a value */
	function Setting(value) {
		this.value = value;
		this.timestamp = Date.now();
		this.version = chrome.app.getDetails().version;
	};

	return settingsHandler;
});
