define(["TextSplitter","WebAudioPlayer"], function(textSplitter, webAudioPlayer) {

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
	
	/** @return length of "Powered by iSpeech" at the end of the returned audio */
	function getPromoTextLength(lan) {
		switch(lan) {
			case("en-US"): return 1.85;
			case("en-GB"): return 1.85;
			default: return null;
		}
	}
	
	//================================================= public =================================================
	/** the object to be returned */
	var tts = {
		/** given callback is executed when playing starts */
		set onStart(callback) { webAudioPlayer.onStart = callback || function() {};}
		,set onEnd(callback) { webAudioPlayer.onEnd = callback || function() {};}
	};
	
	/** reads given text on given language (stops playing if already is playing)
	 * @param c.text the text to be read
	 * @param c.lan the language of reading */
	tts.read = function(c) {
		tts.stop();
		if(! c.text) {return;}

		//iSpeech only accepts max 32 words
		//we try to split by sentence ends, commas or spaces
		var splitText = textSplitter.splitToWord({
			text: c.text
			,limit: 32
			,reArray: [/\.\s/g, /\,\s/g, /\s/g]
		});

		webAudioPlayer.read({
			urlArr: splitText.map(
				function(part) {
					return buildUrl({
						text: part
						,lan: c.lan
				});
			})
			,cutEnd: getPromoTextLength(c.lan) //cut off "powered by iSpeech"
		});
	};
	
	/** stops playing the audio (not only pause!)*/
	tts.stop = function() {
		webAudioPlayer.stop();
	}
	
	/** sets the speed of playing */
	tts.setSpeed = function(newSpeed) {
		webAudioPlayer.setSpeed(newSpeed);
	}
	
	return tts;
});