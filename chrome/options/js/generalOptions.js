angular.module('optionsApp')
.controller('generalOptionsController', function($scope) {

	//set up the list of options (select event + read event)
	$scope.selectTypeOptions = [
		{value:"highlightSelect", text:"highlighted paragraph", selected:false}
		,{value:"builtInSelect", text:"browser built-in selection", selected:false}
	];
	$scope.highlightEventOptions = [
		{value:"highlightOnHover", text:"mouse", selected:false}
		,{value:"highlightOnArrows", text:"arrows", selected:false}
	];
	$scope.readEventOptions = [
		{value:"readOnClick", text:"click", selected:false}
		,{value:"readOnSpace", text:"spacebar", selected:false}
	];

	//user interaction with the lists
	$scope.onSelectTypeOptionClick = function(clickedOption) {
		$scope.selectTypeOptions.forEach(function(option) {option.selected = false;});
		clickedOption.selected = true;
		sendSet("selectType", clickedOption.value);
	}
	$scope.onSelectEventOptionClick = function(clickedOption) {
		clickedOption.selected = clickedOption.selected?false:true;
		//a boolean is stored for each option.value
		sendSet(clickedOption.value, clickedOption.selected);
	}
	$scope.onReadEventOptionClick = function(clickedOption) {
		clickedOption.selected = clickedOption.selected?false:true;
		//a boolean is stored for each option.value
		sendSet(clickedOption.value, clickedOption.selected);
	}
	$scope.highlightSettingsAvailable = function() {
		var result = true;
		$scope.selectTypeOptions.forEach(function(option) {
			if(option.value == "builtInSelect" && option.selected) result = false;
		});
		return result;
	}
	
	//initial setup
	getSettings(function(settings) {
		$scope.selectTypeOptions.forEach(function(option) {option.selected = (settings.selectType == option.value);});
		$scope.highlightEventOptions.forEach(function(option) {option.selected = (settings[option.value]);});
		$scope.readEventOptions.forEach(function(option) {option.selected = (settings[option.value]);});
		$scope.$digest();	//so angular recognizes the change
	});
});