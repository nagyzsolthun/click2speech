angular.module('optionsApp')
.controller('generalOptionsController', function($scope) {
	function toMessage(text) {return chrome.i18n.getMessage(text) || "*"+text+"*";}
	$scope.selectionOptionsName = toMessage("selectionOptions");
	$scope.highlightOptionsName = toMessage("highlightOptions");
	$scope.clickEventDelegationOptionsName = toMessage("clickEventDelegationOptions");
	
	//set up the list of options (select event + read event)
	$scope.selectTypeOptions = [
		{value:"highlightSelect", text:toMessage("highlightSelect"), selected:false}
		,{value:"builtInSelect", text:toMessage("builtInSelect"), selected:false}
	];
	$scope.highlightOptions = [
		{value:"highlightOnArrows", text:toMessage("highlightOnArrows"), selected:false}
		,{value:"noDelegateFirstClick", text:toMessage("noDelegateFirstClick"), selected:false}
	];

	//user interaction with the lists
	$scope.onSelectTypeOptionClick = function(clickedOption) {
		$scope.selectTypeOptions.forEach(function(option) {option.selected = false;});
		clickedOption.selected = true;
		sendSet("selectType", clickedOption.value);
	}
	
	$scope.onMultiSelectOptionClick = function(clickedOption) {
		clickedOption.selected = clickedOption.selected?false:true;
		sendSet(clickedOption.value, clickedOption.selected);
	}

	$scope.highlightEventOptionsAvailable = function() {
		return $scope.selectTypeOptions.some(function(option) {
			return option.value == "highlightSelect" && option.selected
		});
	}
	
	$scope.optionAvailable = function(option) {
		//if only arrows are available, it returns false. True otherwise.
		if(option.value == "readOnClick") {
			var selectTypeOption = $scope.selectTypeOptions.filter(function(option) {return option.value == "highlightSelect"})[0];
			if(selectTypeOption && !selectTypeOption.selected) return true;	//builtInSelect => click can go
		
			var highlightOnHoverOption = $scope.highlightEventOptions.filter(function(option) {return option.value == "highlightOnHover"})[0];
			if(highlightOnHoverOption && !highlightOnHoverOption.selected) return false; //highlightSelect + no hover => baad
		}

		//no other exception
		return true;
	}
	
	//initial setup
	getSettings(function(settings) {
		$scope.selectTypeOptions.forEach(function(option) {option.selected = (settings.selectType == option.value);});
		$scope.highlightOptions.forEach(function(option) {option.selected = (settings[option.value]);});
		$scope.$digest();	//so angular recognizes the change
	});
});
