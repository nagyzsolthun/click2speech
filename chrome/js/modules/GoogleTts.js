/** @return a WebAudioReader with set up buildUrlArr and getCutLength method to use Google TTS */
define(["TextSplitter","WebAudioReader"], function(TextSplitter, WebAudioReader) {
	/** @return the url of Google TTS to send request
	 * @param text the text to read - length has to be max 100 characters
	 * @param lan the language of reading*/
	function buildUrl(text, lan) {
		//lan = lan.substr(2);
		var ttsurl = "https://translate.google.co.uk/translate_tts";
		var result = ttsurl + "?q=" + text + "&tl="+lan;
		return result;
	}
	
	//google TTS API doesn't accept requests for longer than 100 characters texts
	//we try to split by sentence ends, commas or spaces
	function buildUrlArr(c) {
		var splitText = TextSplitter.splitToChar({
			text: c.text
			,limit: 100
			,reArray: [/\.\s/g, /\,\s/g, /\s/g]
		});
		return splitText.map(function(part) {return buildUrl(part, c.lan);})
	};
	
	var reader = new WebAudioReader({name: "Google", buildUrlArr: buildUrlArr});

	console.log("GoogleTts initialized");
	return reader;
});