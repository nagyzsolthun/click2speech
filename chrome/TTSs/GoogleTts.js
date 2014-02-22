function GoogleTts() {
	var ttsurl = "https://translate.google.co.uk/translate_tts";

	/** @return index of the end of the last regexp match under given limit in text or -1 if there is no*/
	function lastMatcEndhUnderLimit(text, limit, re) {
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
	
	/** @return index of the end of the last regexp match under given limit in text
	 used regexp is the first regexp in given array
	 if no regexp matches then returns limit*/
	function lastMatchEndUnderLimitArray(text, limit, reArray) {
		for(var i=0; i<reArray.length; i++) {
			var result = lastMatcEndhUnderLimit(text, limit, reArray[i]);
			if(result > -1) return result;
		}
		return limit;
	}
	
	/** splits text to provide maximum limit length parts
	 * tries to use reArray as delimiters (priority is order)
	 * if no re matches then splits at limit*/
	function splitTextByRegexpArray(text, limit, reArray) {
		var result = [];
		while(text.length > limit) {
			var indexOfSplit = lastMatchEndUnderLimitArray(text, limit, reArray);
			result.push(text.substr(0, indexOfSplit));
			text = text.substr(indexOfSplit);
		}
		result.push(text);
		
		return result;
	}
	
	/**requests sent to Google TTS can contain text length of maximum 100 characters*/
	function splitText(text, limit, delimiters) {
		result = [];
		for(var i=0; i<delimiters.length; i++) {
			while(text.length > limit) {
				
			}
			var highestIndex = 0;
			
		}
	}
	
	//http://stackoverflow.com/questions/21959827/javascript-play-multiple-audios-after-each-other
	function createPlayCallback(audio) {
		return function() {audio.play();}
	}
	
	this.name = function() {
		return "Google"
	}
	
	this.read = function(text) {
		var splitText = splitTextByRegexpArray(text, 100, [/\.\s/g, /\,\s/g, /\s/g]);
		
		var audios = [];
		for(var i=0; i<splitText.length; i++) {
			audios.push(new Audio());
			var url = ttsurl + "?q=" + splitText[i] + "&tl=hu";	//maxlen is 100!
			audios[i].src = url;
			if(i>0) {
				audios[i-1].onended = createPlayCallback(audios[i]);
			}
		}
		audios[0].onloadeddata = function() {audios[0].play();}
	};
	
	this.stop = function() {
		audo.pause();
	}
}