angular.module('optionsApp').controller('navigationBarController', function($scope, $location) {
	$scope.isActive = function(path) {return path == $location.path();}
	$scope.redirect = function(path) {$location.path(path);}
});
