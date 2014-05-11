/* this is a content script - it is attached to each opened webpage*/
document.onmousedown = function() {
	chrome.runtime.sendMessage({
		textToSpeech: getSelection().toString(),
		languageOfDocument: document.documentElement.lang
	});
}