/** setters and getters for settings - persistence is also provided by chrome.storage.local*/
define([], function() {
	var settingsHandler = {};
	
	/** async read of settings
	 * @param response is called with the settings object
	 * if no settings stored (first ever execution) it persists the default values */
	settingsHandler.getAll = function(response) {
		chrome.storage.local.get('settings', function(items) {
			if(items.settings) {
				response(items.settings);
				return;
			}
			
			//settings are not persisted (first ever execution)
			settings = {
				turnedOn:true
				,selectType:"highlightSelect"
				,highlightOnArrows:false
				,noDelegateFirstClick:false
				,tts:"iSpeech"
				,gender:"female"
				,speed:1
			}
			console.log("persist defaults..");
			chrome.storage.local.set({settings:settings});
			chrome.storage.local.set({setting2timestamp:{}});	//time when each setting was set
			chrome.storage.local.set({setting2version:{}});	//the version of the extension in which each setting was set

			chrome.storage.local.set({createTimestamp:Date.now()});
			chrome.storage.local.set({createVersion:chrome.app.getDetails().version});

			response(settings);
		});
	}
	
	/** persists given setting */
	settingsHandler.set = function(setting, value) {
		chrome.storage.local.get(['settings', 'setting2timestamp', 'setting2version'], function(items) {
			if(items.settings[setting] == value) return;
		
			items.settings[setting] = value;
			items.setting2timestamp[setting] = Date.now();
			items.setting2version[setting] = chrome.app.getDetails().version;
			
			chrome.storage.local.set({settings:items.settings});
			chrome.storage.local.set({setting2timestamp:items.setting2timestamp});
			chrome.storage.local.set({setting2version:items.setting2version});
		});
	}

	return settingsHandler;
});
