define(["tts/TextSplitter","tts/UrlSpeech","tts/UrlAudioTester"], function(TextSplitter, UrlSpeech, UrlAudioTester) {
	/** @return the url of Google TTS to send request
	 * @param c.text the text to read - length has to be max 100 characters
	 * @param c.lan the language of reading*/
	function buildUrl(c) {
		var ttsurl = "http://translate.google.com/translate_tts?";
		var result = ttsurl + "ie=UTF-8Ctotal=1&idx=0&client=a&prev=input&tl=" + c.lan + "&q=" + encodeURIComponent(c.text);
		return result;
	}
	
	// =================================== public ===================================
	var reader = {
		get name() {return "Google";}
		,get properties() {return ["speed"];}
	};

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
		var lan = c.lan || navigator.language;
		var urlArr = textArr.map(function(text) {return buildUrl({text:text, lan:lan});});
		
		return new UrlSpeech({tts:reader.name, textArr:textArr, urlArr:urlArr, speed: c.speed});
	}
	
	/** @param callback called with true if the tts is available; with false if failed */
	reader.test = function(callback) {
		var text = Math.round(Math.random() * 1000);
		var url = buildUrl({text:text, lan:navigator.language});	//lan: maybe navigator.language?
		UrlAudioTester.test({url:url, callback:callback});
	}

	return reader;
});
