define(["TextSplitter"], function(textSplitter) {
	var speed = 1;
	var audios = [];
	var audioNodes = [];
	var audioContext = new webkitAudioContext();
	var audioAnalyser = audioContext.createAnalyser();
	audioAnalyser.connect(audioContext.destination);
	audioAnalyser.fftSize = 32;
	var frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
	
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

	/** @return a callback that needs to be executed when an audio is expected to play
	 * if the data is loaded, the audio starts playing right away
	 * if the data is not loaded, the audio starts playing when data is loaded*/
	function createPlayCallback(audio) {
		return function() {
			if(audio.readyState == 4) audio.play();
			else audio.onloadeddata = audio.play;
		}
	}
	
	//================================================= public =================================================
	/** the object to be returned */
	var tts = {
		/** @return the audioAnalyser node, used for drawing the icon */
		get audioAnalyser() {return audioAnalyser;}
	};
	
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
		audioNodes.forEach(function(node){node.disconnect();});
		audioNodes = [];
		
		splitText.forEach(function(part, i) {
			var audio = new Audio();
			audio.defaultPlaybackRate = speed;
			audio.src = buildUrl(part, c.lan);
			audios.push(audio);
			
			var audioNode = audioContext.createMediaElementSource(audios[i]);
			audioNode.connect(audioAnalyser);
			
			if(i==0) audio.onloadeddata = createPlayCallback(audio);
			else audios[i-1].onended = createPlayCallback(audio);
		});
	};
	
	/** stops playing the audio (not only pause!)*/
	tts.stop = function() {
		audios.forEach(function(audio) {
			audio.pause();
			audio.removeAttribute("src");
		});
		audios = [];
	}
	
	/** sets the speed of playing */
	tts.setSpeed = function(newSpeed) {
		speed = newSpeed;
		for(var i=0; i<audios.length; i++) {
			audios[i].playbackRate = speed;
		}
	}
	
	return tts;
});