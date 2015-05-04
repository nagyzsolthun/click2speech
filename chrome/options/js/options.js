var app = angular.module('optionsApp', ['ngRoute','ngAnimate']);

/** notifies background.js about a changed setting*/
function sendSet(setting, value) {
	chrome.runtime.sendMessage({action:"PressToSpeech.set",setting: setting,value: value});
	console.log("PressToSpeech.set: " + setting + " " + value);
}

function getSettings(callback) {
	chrome.runtime.sendMessage({action: "PressToSpeech.getSettings"}, callback);
}

app.config(function($routeProvider) {
	$routeProvider.when('/general', {templateUrl: 'generalOptions.html', controller: 'generalOptionsController'});
	$routeProvider.when('/reading', {templateUrl: 'readingOptions.html', controller: 'readingOptionsController'});
	$routeProvider.otherwise({redirectTo: '/general'});
});