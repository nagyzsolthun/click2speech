angular.module('optionsApp').controller('generalOptionsController', function($scope) {
	var backgroundCommunicationPort = chrome.runtime.connect();
	
	//set up the list of options (select event + read event)
	$scope.selectOptions = [
		{value:"hoverSelect", selected:false}
		,{value:"arrowSelect", selected:false}
		,{value:"browserSelect", selected:false}
	];

	$scope.onMultiSelectOptionClick = function(clickedOption) {
		clickedOption.selected = clickedOption.selected?false:true;
		backgroundCommunicationPort.postMessage({
			action:"updateSetting"
			,setting:clickedOption.value
			,value:clickedOption.selected
		});
	}
	
	//initial setup
	backgroundCommunicationPort.onMessage.addListener(function(message) {
		if(message.action != "updateSettings") return;
		$scope.selectOptions.forEach(function(option) {option.selected = message.settings[option.value];});
		$scope.$digest();	//so angular recognizes the change
	});
	backgroundCommunicationPort.postMessage({action:"getSettings"});
});
