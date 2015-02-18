function testTts(tts, callback) {
	chrome.runtime.sendMessage({action: "webReader.testTtsServices", tts:tts}, function(success) {
		console.log(tts + " " + success);
	});
}

angular.module('optionsApp')
.controller('readingOptionsController', function($scope) {
	$scope.services = [];
	$scope.speed = {min: 0.5, max: 4, step: 0.1}
	
	$scope.onClick = function(clickedOption) {
		if(clickedOption.status != "available") return;

		$scope.services.forEach(function(service) {service.selected = false;});
		clickedOption.selected = true;
		sendSet("preferredTts", clickedOption.name);
	}
	$scope.$watch('speed.value', function() {
		//range provides updates as strings and not numbers => need to convert
		//https://github.com/angular/angular.js/issues/5892
		$scope.speed.value = parseFloat($scope.speed.value);
		
		//BUG: sendSet is sent every startup
		//if is needed because the initial value is Nan, and setSet gets called because the above conversion
		if($scope.speed.value) sendSet("speed", $scope.speed.value);
	});

	chrome.runtime.sendMessage({action: "webReader.getTtsServiceNames"}, function(names) {
		names.forEach(function(name) {
			var ttsService = {name: name, selected: false, status: "loading"};
			$scope.services.push(ttsService);
			chrome.runtime.sendMessage({action: "webReader.testTtsServices", tts:name}, function(success) {
				if(success) ttsService.status = "available";
				else ttsService.status = "unavailable";
				$scope.$digest();
			});
		});
		$scope.$digest();	//so angular recognizes the change
	});
	
	getSettings(function(settings) {
		$scope.services.forEach(function(service) {
			service.selected = (service.name == settings.preferredTts);
		});
		$scope.speed.value = Number(settings.speed) || 1;	//string needs to be converted to number - angular otherwise throws numberFormatError
		$scope.$digest();	//so angular recognizes the change
	});
});