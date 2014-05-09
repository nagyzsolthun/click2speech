var iconDrawer = new IconDrawer();
var tts = new GoogleTts();

//executed when message is received from content.js
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(request.hasOwnProperty("textToSpeech")) {
			tts.read(request.textToSpeech, request.languageOfSpeech);
		}
	}
);

var audioAnalyser = tts.getAudioAnalyser();

//icon is redrawn when volume of speech changes
var previousVolume = 0;
setInterval(function(){	
	var frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
	audioAnalyser.getByteFrequencyData(frequencyData);
	var currentVolume = (frequencyData[0]/255) * 1.5;	//TODO this should be average or max or something..
	if(previousVolume != currentVolume) {
		iconDrawer.updateIcon(currentVolume);
	}
},10);