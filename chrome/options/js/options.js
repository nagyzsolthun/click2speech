var app = angular.module('optionsApp', ['ngRoute','ngAnimate']);

/** notifies background.js about a changed setting*/
function sendSet(setting, value) {
	chrome.runtime.sendMessage({action:"set",setting: setting,value: value});
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

//===================================== Google Anyltics =====================================
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://ssl.google-analytics.com/analytics.js','analytics');

analytics('create', 'UA-67507804-1', 'auto');	//create tracker
analytics('set', 'checkProtocolTask', function(){})	//https://code.google.com/p/analytics-issues/issues/detail?id=312
analytics('set', 'page', '/options');
analytics('send', 'pageview');
