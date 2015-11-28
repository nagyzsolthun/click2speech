angular.module('optionsApp')
.controller('contactController', function($scope) {
	var extensionurl = "https://chrome.google.com/webstore/detail/click-to-speech/djfpbemmcokhlllnafdmomgecdlicfhj";
	function getStoreUrl(page, lan) {
		return extensionurl + "/" + page + "?hl=" + lan;
	}

	$scope.reviewsUrlName = toMessage("reviewsUrl");
	$scope.supportUrlName = toMessage("supportUrl");
	$scope.githubUrlName = toMessage("githubUrl");
	$scope.linkedinUrlName = toMessage("linkedinUrl");
	
	$scope.reviewsUrl = getStoreUrl("reviews", navigator.language);
	$scope.supportUrl = getStoreUrl("support", navigator.language);
	$scope.githubUrl = "https://github.com/nagyzsolthun/ClickToSpeech";
	$scope.linkedinUrl = "https://hu.linkedin.com/in/nagyzsolthun";
	
	$scope.onClick = function(clicked) {
		chrome.runtime.sendMessage({action: "contactClick", contact: clicked});
	}
});
