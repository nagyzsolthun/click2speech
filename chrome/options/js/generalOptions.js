angular.module('optionsApp')
.controller('generalOptionsController', function($scope) {
	function toMessage(text) {return chrome.i18n.getMessage(text) || "*"+text+"*";}
	$scope.selectionOptionsName = toMessage("selectionOptions");
	$scope.highlightOptionsName = toMessage("highlightOptions");
	$scope.readEventOptionsName = toMessage("readEventOptions");
	$scope.audioFeedbackOptionsName = toMessage("audioFeedbackOptions");
	
	//set up the list of options (select event + read event)
	$scope.selectTypeOptions = [
		{value:"highlightSelect", text:toMessage("highlightSelect"), selected:false}
		,{value:"builtInSelect", text:toMessage("builtInSelect"), selected:false}
	];
	$scope.highlightEventOptions = [
		{value:"highlightOnHover", text:toMessage("highlightOnHover"), selected:false}
		,{value:"highlightOnArrows", text:toMessage("highlightOnArrows"), selected:false}
	];
	$scope.readEventOptions = [
		{value:"readOnClick", text:toMessage("readOnClick"), selected:false}
		,{value:"readOnSpace", text:toMessage("readOnSpace"), selected:false}
	];
	$scope.audioFeedbackOptions = [
		{value:"audioFeedbackOnArrows", text:toMessage("audioFeedbackOnArrows"), selected:false}
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