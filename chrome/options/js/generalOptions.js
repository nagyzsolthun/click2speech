angular.module('optionsApp')
.controller('selectEventOptionsController', function($scope) {
	$scope.selectEventOptions = [
		{value:"pointedParagraph", text:"pointed paragraph", selected:false}
		,{value:"browserSelect", text:"browser provided selection", selected:false}
	];
	$scope.onClick = function(clickedOption) {
		$scope.selectEventOptions.forEach(function(option) {option.selected = false;});
		clickedOption.selected = true;
		sendSet("selectEvent", clickedOption.value);
	}
	getSettings(function(settings) {
		$scope.selectEventOptions.forEach(function(option) {option.selected = (settings.selectEvent == option.value);});
		$scope.$digest();	//so angular recognizes the change
	});
})
.controller('readEventOptionsController', function($scope) {
	$scope.readEventOptions = [
		{value:"readOnClick", text:"click", selected:false}
		,{value:"readOnKeyboard", text:"keyboard", selected:false}
	];
	$scope.onClick = function(clickedOption) {
		clickedOption.selected = clickedOption.selected?false:true;
		//a boolean is stored for each option.value
		sendSet(clickedOption.value, clickedOption.selected);
	}
	getSettings(function(settings) {
		$scope.readEventOptions.forEach(function(option) {
			//a boolean is stored for each option.value
			option.selected = (settings[option.value]);
		});
		$scope.$digest();	//so angular recognizes the change
	});
});