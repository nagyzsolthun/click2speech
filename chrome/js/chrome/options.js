app = angular.module('optionsApp', []);

/** notifies background.js about a changed setting*/
function sendSet(setting, value) {
	chrome.runtime.sendMessage({action:"webReader.set",setting: setting,value: value});
	console.log("webreader.set: " + setting + " " + value);
}

var settingsReceivedListeners = [];
chrome.runtime.sendMessage({action: "webReader.getSettings"}, function(settings) {
	settingsReceivedListeners.forEach(function(listener) {
		listener(settings);
	});
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
		min: 0.5, max: 4, step: 0.1, value:1
	}
	
	$scope.$watch('speed.value', function() {
		//range provides updates as strings and not numbers => need to convert
		//https://github.com/angular/angular.js/issues/5892
		$scope.speed.value = parseFloat($scope.speed.value);
		sendSet("speed", $scope.speed.value);
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