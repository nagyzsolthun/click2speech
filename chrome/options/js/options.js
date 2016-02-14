var app = angular.module('optionsApp', ['ngRoute','ngAnimate']);

var backgroundCommunicationPort = chrome.runtime.connect();

/** notifies background.js about a changed setting*/
function sendSet(setting, value) {
	backgroundCommunicationPort.postMessage({action:"updateSetting",setting: setting,value: value});
}

function toMessage(text) {
	return chrome.i18n.getMessage(text) || text;
}

app.config(function($routeProvider) {
	$routeProvider.when('/general', {templateUrl: 'generalOptions.html', controller: 'generalOptionsController'});
	$routeProvider.when('/reading', {templateUrl: 'readingOptions.html', controller: 'readingOptionsController'});
	$routeProvider.when('/contact', {templateUrl: 'contact.html', controller: 'contactController'});
	$routeProvider.otherwise({redirectTo: '/general'});
});
