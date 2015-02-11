var app = angular.module('optionsApp', ['ngRoute']);

/** notifies background.js about a changed setting*/
function sendSet(setting, value) {
	chrome.runtime.sendMessage({action:"webReader.set",setting: setting,value: value});
	console.log("webreader.set: " + setting + " " + value);
}

function getSettings(callback) {
	chrome.runtime.sendMessage({action: "webReader.getSettings"}, callback);
}

app.config(function($routeProvider) {
	$routeProvider.when('/general', {templateUrl: 'generalOptions.html'});
	$routeProvider.when('/reading', {templateUrl: 'readingOptions.html'});
	$routeProvider.otherwise({redirectTo: '/general'});
});