/** @param testLines the text to show at the bottom of options page */
require(["testLines"], function(testLines) {
	var speedNumber = document.getElementById("speedNumber");
	var speedRange = document.getElementById("speedRange");
	chrome.runtime.sendMessage({action: "tts-getSpeed"}, function(response) {
		speedNumber.value = response.speed;
		speedRange.value = response.speed;
	});
	speedNumber.onchange = function() {
		chrome.runtime.sendMessage({action: "tts-setSpeed",speed: this.value});
		speedRange.value = this.value;
	}
	speedRange.oninput = function() {
		chrome.runtime.sendMessage({action: "tts-setSpeed",speed: this.value});
		speedNumber.value = this.value;
	}
	
	var textToRead = document.getElementById("textToRead");
	textToRead.value = testLines[navigator.language];
	
	textToRead.onmousedown = function() {
		chrome.runtime.sendMessage({
			action: "tts-read",
			textToSpeech: getSelection().toString(),
			languageOfDocument: document.documentElement.lang
		});
	}
});