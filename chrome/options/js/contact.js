angular.module('optionsApp').controller('contactController', function($scope) {
	var extensionurl = "https://chrome.google.com/webstore/detail/click-to-speech/djfpbemmcokhlllnafdmomgecdlicfhj";
	function getStoreUrl(page, lan) {
		return extensionurl + "/" + page + "?hl=" + lan;
	}

	function getSupportEmailAddress() {
		return "nagydotzsoltdothunatgmaildotcom".replace(/dot/g,".").replace(/at/g,"@");	//obfuscate against spammers
	}
	
	$scope.supportEmail = getSupportEmailAddress();
	$scope.reviewsUrl = getStoreUrl("reviews", navigator.language);
	
	var backgroundCommunicationPort = chrome.runtime.connect();
	$scope.onContactClick = function(contact) {
		backgroundCommunicationPort.postMessage({action: "contactInteraction", interaction: contact+"-click"});
	}

	//lets check if the selected text is any of the hrefs
	document.addEventListener("mouseup", function() {
		//setTimeout because when clicking on empty area (and unselecting selection) getSelection() returns inconsistent data
		window.setTimeout(function() {
			switch(getSelection().toString()) {
				case($scope.supportEmail): backgroundCommunicationPort.postMessage({action: "contactInteraction", interaction: "support-select"}); break;
				case($scope.reviewsUrl): backgroundCommunicationPort.postMessage({action: "contactInteraction", interaction: "reviews-select"}); break
			}
		}, 0);
	});
});
