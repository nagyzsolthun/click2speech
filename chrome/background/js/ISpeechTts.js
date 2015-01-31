/** @return a WebAudioReader with set up buildUrlArr and getCutLength method to use iSpeech */
define(["TextSplitter","WebAudioReader"], function(TextSplitter, WebAudioReader) {

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
	 * @param c.lan the language (some have the promo text, some don't)*/
	function getCutLength(c) {
		switch(c.lan) {
			case("en-US"): return 1.85;
			case("en-GB"): return 1.85;
			default: return null;
		}
	}

	//iSpeech only accepts max 32 words
	//we try to split by sentence ends, commas or spaces
	function buildUrlArr(c) {
		var splitText = TextSplitter.splitToWord({
			text: c.text
			,limit: 32
			,reArray: [/\.\s/g, /\,\s/g, /\s/g]
		});

		return splitText.map(
			function(part) {
				return buildUrl({
					text: part
					,lan: c.lan
			});
		});
	};
	
	var reader = new WebAudioReader({name: "iSpeech", buildUrlArr: buildUrlArr, getCutLength: getCutLength});
	
	console.log("iSpeechTts initialized");
	return reader;
});