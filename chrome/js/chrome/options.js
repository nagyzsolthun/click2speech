require.config({
	baseUrl: "/../js/modules"
});

/** @param TestLines the text to show at the bottom of options page */
require([], function() {
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
});