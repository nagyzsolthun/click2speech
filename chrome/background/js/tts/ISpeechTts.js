define(["tts/TextSplitter","tts/UrlSpeech"], function(TextSplitter, UrlSpeech) {
	
	//this list was generated based on http://www.ispeech.org/api -> voices
	//there are duplicates, first wins in these cases
	var voices = [
		{lan:"en", dialect: "US", gender: "female", iSpeechVoice: "usenglishfemale"}
		,{lan:"en", dialect: "US", gender: "male", iSpeechVoice: "usenglishmale"}
		,{lan:"en", dialect: "GB", gender: "female", iSpeechVoice: "ukenglishfemale"}
		,{lan:"en", dialect: "GB", gender: "male", iSpeechVoice: "ukenglishmale"}
		,{lan:"en", dialect: "AU", gender: "female", iSpeechVoice: "auenglishfemale"}
		,{lan:"es", dialect: "", gender: "female", iSpeechVoice: "usspanishfemale"}
		,{lan:"es", dialect: "", gender: "male", iSpeechVoice: "usspanishmale"}
		,{lan:"zh", dialect: "", gender: "female", iSpeechVoice: "chchinesefemale"}
		,{lan:"zh", dialect: "", gender: "male", iSpeechVoice: "chchinesemale"}
		,{lan:"zh", dialect: "", gender: "female", iSpeechVoice: "hkchinesefemale"}
		,{lan:"zh", dialect: "", gender: "female", iSpeechVoice: "twchinesefemale"}
		,{lan:"ja", dialect: "", gender: "female", iSpeechVoice: "jpjapanesefemale"}
		,{lan:"ja", dialect: "", gender: "male", iSpeechVoice: "jpjapanesemale"}
		,{lan:"ko", dialect: "", gender: "female", iSpeechVoice: "krkoreanfemale"}
		,{lan:"ko", dialect: "", gender: "male", iSpeechVoice: "krkoreanmale"}
		,{lan:"en", dialect: "CA", gender: "female", iSpeechVoice: "caenglishfemale"}
		,{lan:"hu", dialect: "", gender: "female", iSpeechVoice: "huhungarianfemale"}
		,{lan:"pt", dialect: "", gender: "female", iSpeechVoice: "brportuguesefemale"}
		,{lan:"pt", dialect: "", gender: "female", iSpeechVoice: "eurportuguesefemale"}
		,{lan:"pt", dialect: "", gender: "male", iSpeechVoice: "eurportuguesemale"}
		,{lan:"es", dialect: "", gender: "female", iSpeechVoice: "eurspanishfemale"}
		,{lan:"es", dialect: "", gender: "male", iSpeechVoice: "eurspanishmale"}
		,{lan:"ca", dialect: "", gender: "female", iSpeechVoice: "eurcatalanfemale"}
		,{lan:"cs", dialect: "", gender: "female", iSpeechVoice: "eurczechfemale"}
		,{lan:"da", dialect: "", gender: "female", iSpeechVoice: "eurdanishfemale"}
		,{lan:"fi", dialect: "", gender: "female", iSpeechVoice: "eurfinnishfemale"}
		,{lan:"fr", dialect: "", gender: "female", iSpeechVoice: "eurfrenchfemale"}
		,{lan:"fr", dialect: "", gender: "male", iSpeechVoice: "eurfrenchmale"}
		,{lan:"no", dialect: "", gender: "female", iSpeechVoice: "eurnorwegianfemale"}
		,{lan:"nl", dialect: "", gender: "female", iSpeechVoice: "eurdutchfemale"}
		,{lan:"pl", dialect: "", gender: "female", iSpeechVoice: "eurpolishfemale"}
		,{lan:"it", dialect: "", gender: "female", iSpeechVoice: "euritalianfemale"}
		,{lan:"it", dialect: "", gender: "male", iSpeechVoice: "euritalianmale"}
		,{lan:"tr", dialect: "", gender: "female", iSpeechVoice: "eurturkishfemale"}
		,{lan:"tr", dialect: "", gender: "male", iSpeechVoice: "eurturkishmale"}
		,{lan:"de", dialect: "", gender: "female", iSpeechVoice: "eurgermanfemale"}
		,{lan:"de", dialect: "", gender: "male", iSpeechVoice: "eurgermanmale"}
		,{lan:"ru", dialect: "", gender: "female", iSpeechVoice: "rurussianfemale"}
		,{lan:"ru", dialect: "", gender: "male", iSpeechVoice: "rurussianmale"}
		,{lan:"sv", dialect: "", gender: "female", iSpeechVoice: "swswedishfemale"}
		,{lan:"fr", dialect: "", gender: "female", iSpeechVoice: "cafrenchfemale"}
		,{lan:"fr", dialect: "", gender: "male", iSpeechVoice: "cafrenchmale"}
	];
	
	/** @return the iSpeech voice name for given parameters
	 * @param c.lan html iso language lan-DIALECT
	 * @param c.gender the preferred gender (male/female)
	 http://www.ispeech.org/api : voices*/
	function getISpeechVoice(c) {
		var lan = c.lan.split("-")[0];
		var dialect = c.lan.split("-")[1];
		var result,

		//lan + dialect + gender match
		result = voices.filter(function(voice) {return voice.lan == lan && voice.dialect == dialect && voice.gender == c.gender});
		if(result[0]) return result[0].iSpeechVoice;
		
		//lan + dialect match
		result = voices.filter(function(voice) {return voice.lan == lan && voice.dialect == dialect});
		if(result[0]) return result[0].iSpeechVoice;
	   
		//lan + gender match
		result = voices.filter(function(voice) {return voice.lan == lan && voice.gender == c.gender});
		if(result[0]) return result[0].iSpeechVoice;
	   
		//lan match
		result = voices.filter(function(voice) {return voice.lan == lan});
		if(result[0]) return result[0].iSpeechVoice;
	   
		//should never reach
		return "usenglishfemale";
	}

	/** @return the url of iSpeech TTS to send request
	 * @param c.text the text to read - length has to be max 100 characters
	 * @param c.lan the language of reading*/
	function buildUrl(c) {
		var voice = getISpeechVoice({lan:c.lan, gender:c.gender});
		
		var ttsurl = "http://www.ispeech.org/p/generic/getaudio";
		var result = ttsurl + "?text=" + encodeURIComponent(c.text) + "&voice=" + voice + "&speed=-1&action=convert";
		return result;
	}
	
	/** @return length of "Powered by iSpeech" at the end of the returned audio
	 * @param lan the language (some have the promo text, some don't)*/
	function getCutEnd(lan) {
		switch(lan) {
			case("en-US"): return 2.3;
			case("en-GB"): return 2.3;
			case("en"): return 2.3;
			default: return null;
		}
	}

	// =================================== public ===================================
	var reader = {
		get name() {return "iSpeech";}
		,get properties() {return ["speed","gender"];}
	};

	/** @return a speech object set up to read given text
	 * @param c.text the text to read
	 * @param c.lan the language of the text
	 * @param c.speed the speed of reading
	 * @param c.gender the preferred gender of reading*/
	reader.prepare = function(c) {
		var textArr = TextSplitter.splitToWord({
			text: c.text
			,limit: 32
			,reArray: [/\.\s/g, /\,\s/g, /\s/g]
		});
		
		var lan = c.lan || navigator.language;
		var urlArr = textArr.map(function(text) {return buildUrl({text:text, lan:lan, gender:c.gender});});
		
		return new UrlSpeech({tts:reader.name, textArr:textArr, urlArr:urlArr, speed: c.speed, cutEnd: getCutEnd(lan)});
	}
	
	/** @param callback called with true if the tts is available; with false if failed */
	reader.test = function(callback) {
		var text = Math.round(Math.random() * 1000);
		var url = buildUrl({text:text, lan:navigator.language});
		UrlAudioTester.test({url:url, callback:callback});
	}
	
	return reader;
});
