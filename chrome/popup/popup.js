var app = angular.module('popupApp', []);

app.controller('popupController', function($scope) {
	function toMessage(text) {return chrome.i18n.getMessage(text) || "*"+text+"*";}

	$scope.button = {text: "?",ttsOn: false};

	$scope.onOffButtonClick = function() {
		if($scope.button.ttsOn) {
			backgroundCommunicationPort.postMessage({action: "updateSetting", setting:"turnedOn", value: false});
			turnOff();
		} else {
			backgroundCommunicationPort.postMessage({action: "updateSetting", setting:"turnedOn", value: true});
			turnOn();
		}
	}
	
	$scope.openSpeechOptions = function() {
		var speechOptionsUrl = chrome.extension.getURL("options/html/options.html#/speech");
		chrome.tabs.create({url: speechOptionsUrl});
	}
	
	function turnOn() {
		$scope.button.ttsOn = true;
		$scope.button.text = toMessage("turnOff");
	}
	
	function turnOff() {
		$scope.button.ttsOn = false;
		$scope.button.text = toMessage("turnOn");
	}

	// ============================================= message handling =============================================
	var backgroundCommunicationPort = chrome.runtime.connect();
	backgroundCommunicationPort.onMessage.addListener(function(message) {
		var listener = backgroundEventListeners[message.action];
		if(listener) listener(message);
	});

	var backgroundEventListeners = {};
	backgroundEventListeners.updateSettings = function(message) {
		if(message.settings.turnedOn) turnOn();
		else turnOff();
		$scope.$digest();
	}

	backgroundCommunicationPort.postMessage({action:"getSettings"});	//the response will call backgroundEventListeners.updateSettings
});
