var turnedOn = true;

var iconDrawer = new IconDrawer();
var ttsService = new GoogleTts();

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch(request.action) {
			case("tts-read"):
				if(! turnedOn) {return;}
				var text = request.textToSpeech;
				var lan = request.languageOfDocument || navigator.language;
				ttsService.read(text,lan);
				break;
			case("tts-turnOnOff"):
				if(turnedOn) {
					turnedOn = false;
					ttsService.stop();
					iconDrawer.drawTurnedOff();
					chrome.runtime.sendMessage({action: "tts-turnedOff"});
				} else {
					turnedOn = true;
					iconDrawer.drawTurnedOn(0);
					chrome.runtime.sendMessage({action: "tts-turnedOn"});
				}
				break;
		}
	}
);

var audioAnalyser = ttsService.getAudioAnalyser();
var frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);

//icon is redrawn when volume of speech changes
var previousVolume = 0;
setInterval(function(){	
	if(! turnedOn) {return;}
	audioAnalyser.getByteFrequencyData(frequencyData);
	var currentVolume = (frequencyData[0]/255);	//TODO this should be average or max or something..
	if(previousVolume != currentVolume) {
		iconDrawer.drawTurnedOn(currentVolume);
	}
},10);

chrome.runtime.sendMessage({action: "tts-turnedOn"});