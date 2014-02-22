var tts = new GoogleTts();

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(request.textToSpeech) {
			tts.read(request.textToSpeech);
		}
	}
);