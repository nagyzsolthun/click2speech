define(["tts/TextSplitter","tts/UrlSpeech"], function(TextSplitter, UrlSpeech) {

	/** @return the url of Google TTS to send request
	 * @param c.text the text to read - length has to be max 100 characters
	 * @param c.lan the language of reading*/
	function buildUrl(c) {
		var gender = "female";	//TODO setting
		var voice = null;
		switch(c.lan) {
			case("en-US"): voice="usenglishfemale"; break;
			case("en-GB"): voice="ukenglishfemale"; break;
			case("hu"): voice="huhungarianfemale"; break;
			default: alert("not implemented language!"); voice = "usenglishfemale";
		}
		
		var ttsurl = "http://www.ispeech.org/p/generic/getaudio";
		var result = ttsurl + "?text=" + c.text + "&voice=" + voice + "&speed=0&action=convert";//TODO
		return result;
	}
	
	/** @return length of "Powered by iSpeech" at the end of the returned audio
	 * @param lan the language (some have the promo text, some don't)*/
	function getCutLength(lan) {
		switch(lan) {
			case("en-US"): return 1.85;
			case("en-GB"): return 1.85;
			default: return null;
		}
	}

	// =================================== public ===================================
	var reader = {get name() {return "iSpeech";}};

	/** @return a speech object set up to read given text
	 * @param c.text the text to read
	 * @param c.lan the language of the text
	 * @param c.speed the speed of reading */
	reader.prepare = function(c) {
		var textArr = TextSplitter.splitToWord({
			text: c.text
			,limit: 32
			,reArray: [/\.\s/g, /\,\s/g, /\s/g]
		});
		var urlArr = textArr.map(function(text) {return buildUrl({text:text, lan:c.lan});});
		
		return new UrlSpeech({tts:"iSpeech", textArr:textArr, urlArr:urlArr, speed: c.speed, cutLength: getCutLength(c.lan)});
	}
	
	/** calls @param callback with true if Google Tts is available, false otherwise*/
	reader.test = function(callback) {
		callback(true);	//TODO!!!!!!!!!!!!!!!!!!!!!!!!
	}
	
	console.log("iSpeechTts initialized");
	return reader;
});