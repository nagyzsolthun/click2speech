/** @return a WebAudioReader with set up buildUrlArr and getCutLength method to use Google TTS */
define(["tts/TextSplitter","tts/WebAudioReader"], function(TextSplitter, WebAudioReader) {
	/** @return the url of Google TTS to send request
	 * @param c.text the text to read - length has to be max 100 characters
	 * @param c.lan the language of reading*/
	function buildUrl(c) {
		//lan = lan.substr(2);
		var ttsurl = "https://translate.google.co.uk/translate_tts";
		var result = ttsurl + "?q=" + c.text + "&tl="+c.lan;
		return result;
	}
	
	//google TTS API doesn't accept requests for longer than 100 characters texts
	//we try to split by sentence ends, commas or spaces
	function buildReadingParts(c) {
		var splitText = TextSplitter.splitToChar({
			text: c.text
			,limit: 100
			,reArray: [/\.\s/g, /\,\s/g, /\s/g]
		});
		
		return splitText.map(function(part) {
			return {
				text:part
				,url:buildUrl({text:part, lan:c.lan})
			}
		})
	}
	
	var reader = new WebAudioReader({name: "Google", buildReadingParts: buildReadingParts});

	console.log("GoogleTts initialized");
	return reader;
});