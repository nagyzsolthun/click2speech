var app = angular.module('optionsApp', ['ngRoute','ngAnimate']);

/** notifies background.js about a changed setting*/
function sendSet(setting, value) {
	chrome.runtime.sendMessage({action:"clicknspeech.set",setting: setting,value: value});
	console.log("clicknspeech.set: " + setting + " " + value);
}

function getSettings(callback) {
	chrome.runtime.sendMessage({action: "clicknspeech.getSettings"}, callback);
}

app.config(function($routeProvider) {
	$routeProvider.when('/general', {templateUrl: 'generalOptions.html', controller: 'generalOptionsController'});
	$routeProvider.when('/reading', {templateUrl: 'readingOptions.html', controller: 'readingOptionsController'});
	$routeProvider.otherwise({redirectTo: '/general'});
});