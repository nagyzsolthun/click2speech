angular.module('optionsApp').controller('contactController', function($scope) {
	var extensionurl = "https://chrome.google.com/webstore/detail/click-to-speech/djfpbemmcokhlllnafdmomgecdlicfhj";
	function getStoreUrl(page, lan) {
		return extensionurl + "/" + page + "?hl=" + lan;
	}
	
	$scope.reviewsUrl = getStoreUrl("reviews", navigator.language);
	$scope.supportUrl = getStoreUrl("support", navigator.language);
	$scope.githubUrl = "https://github.com/nagyzsolthun/ClickToSpeech";
	$scope.linkedinUrl = "https://hu.linkedin.com/in/nagyzsolthun";
	
	var backgroundCommunicationPort = chrome.runtime.connect();
	$scope.onClick = function(clicked) {
		backgroundCommunicationPort.postMessage({action: "contactClick", contact: clicked});
	}
});
