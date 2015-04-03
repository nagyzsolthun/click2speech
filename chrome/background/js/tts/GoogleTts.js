define(["tts/TextSplitter","tts/UrlSpeech"], function(TextSplitter, UrlSpeech) {
	/** @return the url of Google TTS to send request
	 * @param c.text the text to read - length has to be max 100 characters
	 * @param c.lan the language of reading*/
	function buildUrl(c) {
		var ttsurl = "https://translate.google.co.uk/translate_tts";
		var result = ttsurl + "?q=" + c.text + "&tl="+c.lan;
		return result;
	}
	
	// =================================== public ===================================
	var reader = {get name() {return "Google";}};

	/** @return a speech object set up to read given text
	 * @param c.text the text to read
	 * @param c.lan the language of the text
	 * @param c.speed the speed of reading */
	reader.prepare = function(c) {
		var textArr = TextSplitter.splitToChar({
			text: c.text
			,limit: 100
			,reArray: [/\.\s/g, /\,\s/g, /\s/g]
		});
		var urlArr = textArr.map(function(text) {return buildUrl({text:text, lan:c.lan});});
		
		/*urlArr = [
			"https://translate.google.co.uk/translate_tts?q=google&tl=en-US"
			,"http://www.ispeech.org/p/generic/getaudio?text=iSpeech is set up to read a longer sentence&voice=usenglishfemale&speed=0&action=convert"
			,"https://github.com/nagyzsolthun/WebReader"
			,"https://translate.google.co.uk/translate_tts?q=google&tl=en-US"
		];
		textArr = ["google","iSpeech is set up to read a longer sentence", "something random that causes error.","google again"];*/
		
		return new UrlSpeech({tts:"Google", textArr:textArr, urlArr:urlArr, speed: c.speed});
	}
	
	/** calls @param callback with true if Google Tts is available, false otherwise*/
	reader.test = function(callback) {
		callback(true);	//TODO!!!!!!!!!!!!!!!!!!!!!!!!
	}

	console.log("GoogleTts initialized");
	return reader;
});