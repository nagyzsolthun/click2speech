app = angular.module('optionsApp', ['ngRoute']);

/** notifies background.js about a changed setting*/
function sendSet(setting, value) {
	chrome.runtime.sendMessage({action:"webReader.set",setting: setting,value: value});
	console.log("webreader.set: " + setting + " " + value);
}

var settingsReceivedListeners = [];
function applySettings() {
	chrome.runtime.sendMessage({action: "webReader.getSettings"}, function(settings) {
		settingsReceivedListeners.forEach(function(listener) {
			listener(settings);
		});
	});
}
applySettings();

app.config(function($routeProvider) {
	$routeProvider.when('/general', {templateUrl: 'generalOptions.html'});
	$routeProvider.when('/reading', {templateUrl: 'readingOptions.html'});
	$routeProvider.otherwise({redirectTo: '/general'});
});

//================================== panel ==================================
app.controller('panelController', function($scope, $location) {
	$scope.isActive = function(path) {
		return path == $location.path();
	}
	$scope.redirect = function(path) {
		settingsReceivedListeners = [];	//TODO check if needed
		$location.path(path);
		applySettings();	//when redirected, new scopes are created - we set the values again
	}
});

//================================== select event ==================================
app.controller('selectEventOptionsController', function($scope) {
	$scope.selectEventOptions = [
		{value:"pointedParagraph", text:"pointed paragraph", selected:false}
		,{value:"browserSelect", text:"browser provided selection", selected:false}
	];
	$scope.onClick = function(clickedOption) {
		$scope.selectEventOptions.forEach(function(option) {option.selected = false;});
		clickedOption.selected = true;
		sendSet("selectEvent", clickedOption.value);
	}
	settingsReceivedListeners.push(function(settings) {
		$scope.selectEventOptions.forEach(function(option) {option.selected = (settings.selectEvent == option.value);});
		$scope.$digest();	//so angular recognizes the change
	});
});

//================================== read event ==================================
app.controller('readEventOptionsController', function($scope) {
	$scope.readEventOptions = [
		{value:"readOnClick", text:"click", selected:false}
		,{value:"readOnKeyboard", text:"keyboard", selected:false}
	];
	$scope.onClick = function(clickedOption) {
		clickedOption.selected = clickedOption.selected?false:true;
		//a boolean is stored for each option.value
		sendSet(clickedOption.value, clickedOption.selected);
	}
	settingsReceivedListeners.push(function(settings) {
		$scope.readEventOptions.forEach(function(option) {
			//a boolean is stored for each option.value
			option.selected = (settings[option.value]);
		});
		$scope.$digest();	//so angular recognizes the change
	});
});

//================================== speed ==================================
app.controller('speedRangeController', function($scope) {
	$scope.speed = {
		min: 0.5, max: 4, step: 0.1
	}
	
	$scope.$watch('speed.value', function() {
		//range provides updates as strings and not numbers => need to convert
		//https://github.com/angular/angular.js/issues/5892
		$scope.speed.value = parseFloat($scope.speed.value);
		
		//BUG: sendSet is sent every startup
		//if is needed because the initial value is Nan, and setSet gets called because the above conversion
		if($scope.speed.value) sendSet("speed", $scope.speed.value);
	});
	
	settingsReceivedListeners.push(function(settings) {
		//string needs to be converted to number - angular otherwise throws numberFormatError
		$scope.speed.value = Number(settings.speed) || 1;
		$scope.$digest();	//so angular recognizes the change
	});
});

//================================== services ==================================
app.controller('ttsServiceChooserController', function($scope) {
	$scope.services = [];
	
	chrome.runtime.sendMessage({action: "webReader.getTtsServiceNames"}, function(names) {
		$scope.services = names;
		$scope.$digest();	//so angular recognizes the change
	});
});