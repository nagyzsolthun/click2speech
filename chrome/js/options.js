(function() {
	var speed = 1.0;
	var speedRange = document.getElementById("speedRange");
	speedRange.onchange = function() {
		speed = this.value;
	}

	var testButton = document.getElementById("testButton");
	testButton.onclick = function() {
		var textToRead = document.getElementById("textToRead").value;
		chrome.runtime.sendMessage({
			action: "tts-read"
			,textToSpeech: textToRead
			,speedOfSpeech: speed
			,languageOfDocument: document.documentElement.lang
		});
	}
}());