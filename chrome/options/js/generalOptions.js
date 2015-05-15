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
	$scope.audioFeedbackOptions = [
		{value:"audioFeedbackOnArrows", text:"arrow keys", selected:false}
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
	$scope.onAudioFeedbackOptionClick = function(clickedOption) {
		clickedOption.selected = clickedOption.selected?false:true;
		sendSet(clickedOption.value, clickedOption.selected);
	}

	$scope.highlightEventOptionsAvailable = function() {
		return $scope.selectTypeOptions.some(function(option) {
			return option.value == "highlightSelect" && option.selected
		});
	}
	$scope.audioFeedbackOptionsAvailable = function() {
		return $scope.highlightEventOptionsAvailable() && $scope.highlightEventOptions.some(function(option) {
			return option.value == "highlightOnArrows" && option.selected;
		});
	}
	
	//initial setup
	getSettings(function(settings) {
		$scope.selectTypeOptions.forEach(function(option) {option.selected = (settings.selectType == option.value);});
		$scope.highlightEventOptions.forEach(function(option) {option.selected = (settings[option.value]);});
		$scope.readEventOptions.forEach(function(option) {option.selected = (settings[option.value]);});
		$scope.audioFeedbackOptions.forEach(function(option) {option.selected = (settings[option.value]);});
		$scope.$digest();	//so angular recognizes the change
	});
});