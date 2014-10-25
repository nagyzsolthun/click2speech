define(["TextSplitter"], function(textSplitter) {	
	var audios = [];

	var audioContext = new webkitAudioContext();
	var audioAnalyser = audioContext.createAnalyser();
	audioAnalyser.connect(audioContext.destination);
	audioAnalyser.fftSize = 32;
	
	/** @return the url of Google TTS to send request
	 * @param text the text to read - length has to be max 100 characters
	 * @param lan the language of reading: should be one of the followings:
	 * hu, en*/
	function buildUrl(text, lan) {
		//lan = lan.substr(2);
		var ttsurl = "https://translate.google.co.uk/translate_tts";
		var result = ttsurl + "?q=" + text + "&tl="+lan;
		return result;
	}

	//http://stackoverflow.com/questions/21959827/javascript-play-multiple-audios-after-each-other
	function createPlayCallback(audio) {
		return function() {audio.play();}
	}
	
	//================================================= public =================================================
	/** the object to be returned */
	var tts = {};

	/** the audio analizer node - used for drawing the icon*/
	tts.getAudioAnalyser = function() {
		return audioAnalyser;
	}
	
	/** reads given text on given language (stops playing if already is playing)
	 * @param c.text the text to be read
	 * @param c.lan the language of reading */
	tts.read = function(c) {
		tts.stop();
		if(! c.text) {return;}

		//google TTS API doesn't accept requests for longer than 100 characters texts
		//we try to split by sentence ends, commas or spaces
		var splitText = textSplitter.splitToLimit(c.text, 100, [/\.\s/g, /\,\s/g, /\s/g]);
		
		audios = [];
		for(var i=0; i<splitText.length; i++) {
			audios.push(new Audio());
			audios[i].defaultPlaybackRate = c.speed || 1;
			//new audios are connected to the audioAnalyserNode in order to show colume on the icon
			audioContext.createMediaElementSource(audios[i]).connect(audioAnalyser);	//TODO check if GC collects this
			audios[i].src = buildUrl(splitText[i], c.lan);
			if(i>0) {
				audios[i-1].onended = createPlayCallback(audios[i]);
			}
		}
		audios[0].onloadeddata = function() {audios[0].play();}
	};
	
	/** stops playing the audio (not only pause!)*/
	tts.stop = function() {
		for(var i=0; i<audios.length; i++) {
			audios[i].pause();
			audios[i].removeAttribute("src");
		}
		audios = [];
	}
	
	/** sets the speed of playing */
	tts.setSpeed = function(speed) {
		for(var i=0; i<audios.length; i++) {
			audios[i].playbackRate = speed;
		}
	}
	
	return tts;
});