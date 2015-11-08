angular.module('optionsApp')
.controller('generalOptionsController', function($scope) {
	$scope.selectionOptionsName = toMessage("selectionOptions");
	
	//set up the list of options (select event + read event)
	$scope.selectOptions = [
		{value:"hoverSelect", text:toMessage("hoverSelect"), selected:false}
		,{value:"arrowSelect", text:toMessage("arrowSelect"), selected:false}
		,{value:"browserSelect", text:toMessage("browserSelect"), selected:false}
	];
	
	$scope.onMultiSelectOptionClick = function(clickedOption) {
		clickedOption.selected = clickedOption.selected?false:true;
		sendSet(clickedOption.value, clickedOption.selected);
	}
	
	//initial setup
	getSettings(function(settings) {
		$scope.selectOptions.forEach(function(option) {
			option.selected = settings[option.value];
		});
		$scope.$digest();	//so angular recognizes the change
	});
});
