angular.module('optionsApp')
.controller('generalOptionsController', function($scope) {

	//set up the list of options (select event + read event)
	$scope.selectEventOptions = [
		{value:"hoveredParagraph", text:"hovered paragraph", selected:false}
		,{value:"browserSelect", text:"browser provided selection", selected:false}
	];
	$scope.readEventOptions = [
		{value:"readOnClick", text:"click", selected:false}
		//,{value:"readOnKeyboard", text:"keyboard", selected:false}	/TODO
	];

	//user interaction with the lists
	$scope.onSelectEventOptionClick = function(clickedOption) {
		$scope.selectEventOptions.forEach(function(option) {option.selected = false;});
		clickedOption.selected = true;
		sendSet("selectEvent", clickedOption.value);
	}
	$scope.onReadEventOptionClick = function(clickedOption) {
		clickedOption.selected = clickedOption.selected?false:true;
		//a boolean is stored for each option.value
		sendSet(clickedOption.value, clickedOption.selected);
	}
	
	//initial setup
	getSettings(function(settings) {
		$scope.selectEventOptions.forEach(function(option) {option.selected = (settings.selectEvent == option.value);});
		$scope.readEventOptions.forEach(function(option) {
			//a boolean is stored for each option.value
			option.selected = (settings[option.value]);
		});
		$scope.$digest();	//so angular recognizes the change
	});
});