function GoogleTts() {
	var audios = [];
	
	var audioContext = new webkitAudioContext();
	var audioAnalyser;
	
	var currentVolume = 0;
	
	/**creates the AnalyserNode to receive frequency data
	 * the node is connected to the audios array => when audios change, this method should be executed
	 */
	function buildAudioAnalyser() {
		var source = audioContext.createMediaElementSource(audios[0]);
		var analyser = audioContext.createAnalyser();

		source.connect(analyser);
		analyser.connect(audioContext.destination);
		
		analyser.fftSize = 32;
		console.log(analyser.fftSize);
		console.log(analyser.frequencyBinCount);
		
		audioAnalyser = analyser;
	}
	
	/** gets information from audioAnalyser every 10 milliseconds to update frequency information provided by this service*/
	setInterval(function(){
		if(! audioAnalyser) {return;}
		var frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
		audioAnalyser.getByteFrequencyData(frequencyData);
		currentVolume = frequencyData[0]/255;	//TODO this should be average or max or something..
		//if(frequencyData[0] > 0) {console.log(this.currentVolume);}
	},10);

	/** @return index of last match (end of it) under given limit OR -1 if no match found under limit
	 * @param text
	 * @param re the regexp to be matched - hbas to be global
	 * @param limit the index of last character under which we search for match
	 */
	function lastMatch(text, re, limit) {
		var result = -1;
		var regexpResult;
		while(regexpResult = re.exec(text)) {
			var index = regexpResult.index + regexpResult[0].length;
			if(index > limit || index < 0) {
				break;
			} else {
				result = index;
			}
		}
		re.lastIndex = 0;	//to reset lastIdnex counter. Otherwise regexp would count amtching from last matching index..
		return result;
	}
	
	/** @return index of last match (end of it) under given limit OR given limit or no match found
	 * @param text
	 * @param reArray the regexps to be matched: the first regexp that has match under limit wins
	 * @param limit the index of last character under which we search for match*/
	function lastMatchArr(text, limit, reArray) {
		for(var i=0; i<reArray.length; i++) {
			var result = lastMatch(text, reArray[i], limit);
			if(result > -1) return result;
		}
		return limit;
	}
	
	/** @return array of strings - each string has a lower length then given limit
	 * splitting happens by given regexps
	 * @param text the text to be split
	 * @param limit maximum length of strings in result
	 * @param reArray array of regexps to use for splitting - regexps has to be global
	 */
	function splitToLimit(text, limit, reArray) {
		var result = [];
		while(text.length > limit) {
			var indexOfSplit = lastMatchArr(text, limit, reArray);
			result.push(text.substr(0, indexOfSplit));
			text = text.substr(indexOfSplit);
		}
		if(text.length > 0) {
			result.push(text);
		}
		
		return result;
	}
	
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
	
	/*------------------------------------------------- public stuff -------------------------------------------------*/
	
	this.getCurrentVolume = function() {
		return currentVolume;
	}

	/** the name of this service*/
	this.name = "Google";
	
	/** reads given text on given language (stops playing if started)
	 * @param text the text to be read
	 * @param lan the language of reading
	 */
	this.read = function(text, lan) {
		this.stop();
		if(! text) {return;}

		//google TTS API doesn't accept requests for longer than 100 characters texts
		//we try to split by sentence ends, commas or spaces
		var splitText = splitToLimit(text, 100, [/\.\s/g, /\,\s/g, /\s/g]);
		
		audios = [];
		for(var i=0; i<splitText.length; i++) {
			audios.push(new Audio());
			audios[i].src = buildUrl(splitText[i], lan);
			if(i>0) {
				audios[i-1].onended = createPlayCallback(audios[i]);
			}
		}
		audios[0].onloadeddata = function() {audios[0].play();}
		
		buildAudioAnalyser();
	};
	
	/** stops playing the audio permanently (not only pause!)*/
	this.stop = function() {
		for(var i=0; i<audios.length; i++) {
			audios[i].pause();
			audios[i].removeAttribute("src");
		}
		audios = [];
	}
}