var app = angular.module('popupApp', []);

app.controller('popupController', function($scope) {
	$scope.button = {text: "on/off",ttsOn: false}
	$scope.errors = []

	$scope.onOffButtonClick = function() {
		if($scope.button.ttsOn) {
			chrome.runtime.sendMessage({action: "set", setting:"turnedOn", value: false});
			turnOff();
		} else {
			chrome.runtime.sendMessage({action: "set", setting:"turnedOn", value: true});
			turnOn();
		}
	}
	
	$scope.openReadingOptions = function() {
		var readingOptionsUrl = chrome.extension.getURL("options/html/options.html#/reading");
		chrome.tabs.create({url: readingOptionsUrl});
	}
	
	function turnOn() {
		$scope.button.ttsOn = true;
		$scope.button.text = "turn off";
	}
	
	function turnOff() {
		$scope.button.ttsOn = false;
		$scope.button.text = "turn on";
	}
	
	chrome.runtime.sendMessage({action: "getSettings"}, function(settings) {
		if(settings.turnedOn) turnOn();
		else turnOff();
		$scope.$digest();
	});
	
	chrome.runtime.sendMessage({action: "getErrors"}, function(errors) {
		$scope.errors = [];
		errors.forEach(function(error) {
			$scope.errors.push({ttsName:error.ttsName,type:error.type});
		});
		$scope.$digest();
	});
});