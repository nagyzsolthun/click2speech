angular.module('optionsApp').controller('speechOptionsController', function($scope) {
	var backgroundCommunicationPort = chrome.runtime.connect();
	
	$scope.ttsArr = [];
	$scope.speed = {min: 0.5, max: 4, step: 0.1};
	$scope.genderArr = [{value:"female",text:"femaleSpeech"},{value:"male",text:"maleSpeech"}];
	
	$scope.onServiceOptionClick = function(clickedOption) {
		if(clickedOption.status != "available") return;

		$scope.ttsArr.forEach(function(service) {service.selected = false;});
		clickedOption.selected = true;
		backgroundCommunicationPort.postMessage({action:"updateSetting", setting:"tts", value:clickedOption.name});
	}
	$scope.onGenderOptionClick = function(clickedOption) {
		$scope.genderArr.forEach(function(gender) {gender.selected = false;});
		clickedOption.selected = true;
		backgroundCommunicationPort.postMessage({action:"updateSetting", setting:"gender", value:clickedOption.value});
	}
	$scope.isPropertyOfSelectedTts = function(property) {
		var selectedTts = null;
		$scope.ttsArr.forEach(function(tts) {
			if(tts.selected) selectedTts = tts;
		});
		return selectedTts && selectedTts.properties.indexOf(property) > -1;
	}
	$scope.$watch('speed.value', function(newValue, oldValue) {
		if(!oldValue) return;	//initial speed setting doesn't raise event
		if(newValue == oldValue) return;	//double event would be sent because of the parseFloat
		
		//range provides updates as strings and not numbers => need to convert
		//https://github.com/angular/angular.js/issues/5892
		$scope.speed.value = parseFloat($scope.speed.value);
		
		//BUG: updateSetting is sent at every startup
		//if is needed because the initial value is Nan, and setSet gets called because the above conversion
		if($scope.speed.value) backgroundCommunicationPort.postMessage({action:"updateSetting", setting:"speed", value:$scope.speed.value});
	});

	//initial setup
	backgroundEventListeners = {};
	backgroundCommunicationPort.onMessage.addListener(function(message) {
		var listener = backgroundEventListeners[message.action];
		if(listener) listener(message);
	});
	backgroundEventListeners.updateSettings = function(message) {
		$scope.ttsArr.forEach(function(service) {
			service.selected = (service.name == message.settings.tts);
		});
		$scope.genderArr.forEach(function(gender) {
			gender.selected = (gender.value == message.settings.gender);
		});
		$scope.speed.value = Number(message.settings.speed) || 1;	//string needs to be converted to number - angular otherwise throws numberFormatError
		$scope.$digest();	//so angular recognizes the change
	}
	backgroundEventListeners.updateTtsProperties = function(message) {
		message.ttsProperties.forEach(function(tts) {
			var ttsService = {name: tts.name, properties: tts.properties, selected: false, status: "loading"};
			$scope.ttsArr.push(ttsService);
			backgroundCommunicationPort.postMessage({action:"testTtsService",tts:tts.name});
		});
		$scope.$digest();
	}
	backgroundEventListeners.updateTtsAvailable = function(message) {
		$scope.ttsArr.forEach(function(tts) {
			if(tts.name == message.tts) tts.status = message.available ? "available":"unavailable";
		});
		$scope.$digest();
	}
	backgroundCommunicationPort.postMessage({action:"getSettings"});
	backgroundCommunicationPort.postMessage({action:"getTtsProperties"});
});
