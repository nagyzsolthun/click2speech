angular.module('optionsApp').controller('panelController', function($scope, $location) {
	$scope.isActive = function(path) {return path == $location.path();}
	$scope.redirect = function(path) {$location.path(path);}
});