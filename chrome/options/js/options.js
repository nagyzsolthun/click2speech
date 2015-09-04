var app = angular.module('optionsApp', ['ngRoute','ngAnimate']);

/** notifies background.js about a changed setting*/
function sendSet(setting, value) {
	chrome.runtime.sendMessage({action:"set",setting: setting,value: value});
	console.log("set: " + setting + " " + value);
}

function getSettings(callback) {
	chrome.runtime.sendMessage({action: "getSettings"}, callback);
}

function toMessage(text) {
	return chrome.i18n.getMessage(text) || "*"+text+"*";
}

app.config(function($routeProvider) {
	$routeProvider.when('/general', {templateUrl: 'generalOptions.html', controller: 'generalOptionsController'});
	$routeProvider.when('/reading', {templateUrl: 'readingOptions.html', controller: 'readingOptionsController'});
	$routeProvider.otherwise({redirectTo: '/general'});
});
