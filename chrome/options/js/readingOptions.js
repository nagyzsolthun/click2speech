function testTts(tts, callback) {
	chrome.runtime.sendMessage({action: "testTtsServices", tts:tts}, function(success) {
		console.log(tts + " " + success);
	});
}

angular.module('optionsApp')
.controller('readingOptionsController', function($scope) {
	$scope.ttsArr = [];
	$scope.speed = {min: 0.5, max: 4, step: 0.1}
	$scope.genderArr = [{name:"female"},{name:"male"}];
	
	$scope.onServiceOptionClick = function(clickedOption) {
		if(clickedOption.status != "available") return;

		$scope.ttsArr.forEach(function(service) {service.selected = false;});
		clickedOption.selected = true;
		sendSet("tts", clickedOption.name);
	}
	$scope.onGenderOptionClick = function(clickedOption) {
		$scope.genderArr.forEach(function(gender) {gender.selected = false;});
		clickedOption.selected = true;
		sendSet("gender", clickedOption.name);
	}
	$scope.isPropertyOfSelectedTts = function(property) {
		var selectedTts = null;
		$scope.ttsArr.forEach(function(tts) {
			if(tts.selected) selectedTts = tts;
		});
		return selectedTts && selectedTts.properties.indexOf(property) > -1;
	}
	$scope.$watch('speed.value', function() {
		//range provides updates as strings and not numbers => need to convert
		//https://github.com/angular/angular.js/issues/5892
		$scope.speed.value = parseFloat($scope.speed.value);
		
		//BUG: sendSet is sent every startup
		//if is needed because the initial value is Nan, and setSet gets called because the above conversion
		if($scope.speed.value) sendSet("speed", $scope.speed.value);
	});

	chrome.runtime.sendMessage({action: "getTtsProperties"}, function(ttsProperties) {
		ttsProperties.forEach(function(tts) {
			var ttsService = {name: tts.name, properties: tts.properties, selected: false, status: "loading"};
			$scope.ttsArr.push(ttsService);
			chrome.runtime.sendMessage({action: "testTtsService", tts:tts.name}, function(success) {
				if(success) ttsService.status = "available";
				else ttsService.status = "error";
				$scope.$digest();
			});
		});
		$scope.$digest();	//so angular recognizes the change
	});
	
	getSettings(function(settings) {
		$scope.ttsArr.forEach(function(service) {
			service.selected = (service.name == settings.tts);
		});
		$scope.genderArr.forEach(function(gender) {
			gender.selected = (gender.name == settings.gender);
		});
		$scope.speed.value = Number(settings.speed) || 1;	//string needs to be converted to number - angular otherwise throws numberFormatError
		$scope.$digest();	//so angular recognizes the change
	});
});