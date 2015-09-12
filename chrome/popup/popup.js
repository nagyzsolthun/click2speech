var app = angular.module('popupApp', []);

app.controller('popupController', function($scope) {
	function toMessage(text) {return chrome.i18n.getMessage(text) || "*"+text+"*";}

	$scope.button = {text: "?",ttsOn: false}
	$scope.errors = []

	$scope.onOffButtonClick = function() {
		if($scope.button.ttsOn) {
			chrome.runtime.sendMessage({action: "set", setting:"turnedOn", value: false});
			turnOff();
		} else {
			chrome.runtime.sendMessage({action: "set", setting:"turnedOn", value: true});
			turnOn();
		}
	}
	
	$scope.openReadingOptions = function() {
		var readingOptionsUrl = chrome.extension.getURL("options/html/options.html#/reading");
		chrome.tabs.create({url: readingOptionsUrl});
	}
	
	function turnOn() {
		$scope.button.ttsOn = true;
		$scope.button.text = toMessage("turnOff");
	}
	
	function turnOff() {
		$scope.button.ttsOn = false;
		$scope.button.text = toMessage("turnOn");
	}
	
	chrome.runtime.sendMessage({action: "getSettings"}, function(settings) {
		if(settings.turnedOn) turnOn();
		else turnOff();
		$scope.$digest();
	});
	
	chrome.runtime.sendMessage({action: "getErrors"}, function(errors) {
		$scope.errors = [];
		errors.forEach(function(error) {
			$scope.errors.push({ttsName:error.ttsName,type:error.type});
		});
		$scope.$digest();
	});
	
	//===================================== Google Anyltics =====================================
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','https://ssl.google-analytics.com/analytics.js','analytics');

	analytics('create', 'UA-67507804-1', 'auto');	//create tracker
	analytics('set', 'checkProtocolTask', function(){})	//https://code.google.com/p/analytics-issues/issues/detail?id=312
	analytics('set', 'page', '/popup');
	analytics('send', 'pageview');
});
