/* this is a content script - it is attached to each opened webpage*/
document.onmousedown = function() {
	var text = getSelection().toString();
	var lan = document.documentElement.lang || "hu";
	chrome.runtime.sendMessage({
		textToSpeech: text,
		languageOfSpeech: lan
	});
}