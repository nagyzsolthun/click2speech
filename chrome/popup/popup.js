var app = angular.module('popupApp', []);

app.controller('popupController', function($scope) {
	$scope.button = {text: "on/off",ttsOn: false}
	$scope.notification = {active: false, tts: "", url:""}

	$scope.onOffButtonClick = function() {
		if($scope.button.ttsOn) {
			chrome.runtime.sendMessage({action: "webReader.turnOff"});
			turnOff();
		} else {
			chrome.runtime.sendMessage({action: "webReader.turnOn"});
			turnOn();
		}
	}
	
	$scope.openReadingOptions = function() {
		var readingOptionsUrl = chrome.extension.getURL("options/html/options.html#/reading");
		chrome.tabs.create({url: readingOptionsUrl});
	}
	
	$scope.openUrl = function() {
		chrome.tabs.create({url: $scope.notification.url});
	}
	
	function turnOn() {
		$scope.button.ttsOn = true;
		$scope.button.text = "turn off";
	}
	
	function turnOff() {
		$scope.button.ttsOn = false;
		$scope.button.text = "turn on";
	}
	
	chrome.runtime.sendMessage({action: "webReader.getSettings"}, function(settings) {
		if(settings.turnedOn) turnOn();
		else turnOff();
		$scope.$digest();
	});
	
	chrome.runtime.sendMessage({action: "webReader.getError"}, function(error) {
		if(error.tts) {
			$scope.notification.active = true;
			$scope.notification.tts = error.tts;
			$scope.notification.url = error.url;
			$scope.$digest();
		}
	});
});