document.onmousedown = function() {
		var text = getSelection().toString();
		var lan = document.documentElement.lang || "en";
		chrome.runtime.sendMessage({
			textToSpeech: text,
			languageOfSpeech: lan});
}