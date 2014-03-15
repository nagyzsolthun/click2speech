var tts = new GoogleTts();

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(request.hasOwnProperty("textToSpeech")) {
			tts.read(request.textToSpeech, request.languageOfSpeech);
		}
	}
);