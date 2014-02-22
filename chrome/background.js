function Tts() {
	var ttsurl = "https://translate.google.co.uk/translate_tts";
	var audio = new Audio();
	audio.onloadeddata = function() {
		audio.play();
	};
	
	this.read = function(text) {
		var url =  ttsurl + "?q=" + text + "&tl=hu";	//maxlen is 100!
		audio.src = url;
	}
}

var tts = new Tts();

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(request.textToSpeech) {
			tts.read(request.textToSpeech);
		}
	}
);