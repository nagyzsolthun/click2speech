angular.module('optionsApp', ['ngRoute','ngAnimate']);

angular.module('optionsApp').filter('translate', function() {
	return function(text) {
		return chrome.i18n.getMessage(text) || text;
	}
});

angular.module('optionsApp').config(function($routeProvider) {
	$routeProvider.when('/general', {templateUrl: 'generalOptions.html', controller: 'generalOptionsController'});
	$routeProvider.when('/speech', {templateUrl: 'speechOptions.html', controller: 'speechOptionsController'});
	$routeProvider.when('/contact', {templateUrl: 'contact.html', controller: 'contactController'});
	$routeProvider.otherwise({redirectTo: '/general'});
});
