angular.module('optionsApp')
.controller('readingOptionsController', function($scope) {
	$scope.services = [];
	$scope.speed = {min: 0.5, max: 4, step: 0.1}
	
	$scope.onClick = function(clickedOption) {
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
		names.forEach(function(name) {$scope.services.push({name: name, selected: false});});
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