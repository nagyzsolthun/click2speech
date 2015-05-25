angular.module('optionsApp').controller('navigationBarController', function($scope, $location) {
	$scope.isActive = function(path) {return path == $location.path();}
	$scope.redirect = function(path) {$location.path(path);}
	
	function toMessage(text) {return chrome.i18n.getMessage(text) || "*"+text+"*";}
	$scope.generalOptionsPageName = toMessage("generalOptionsPage");
	$scope.readingOptionsPageName = toMessage("readingOptionsPage");
});
