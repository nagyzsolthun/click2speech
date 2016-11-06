define(["tts/iSpeech/Speech", "tts/iSpeech/UrlBuilder", "tts/TtsTester"], function(Speech, UrlBuilder, TtsTester) {

	var tts = {
		get name() {return "iSpeech";}
		,get properties() {return ["speed","gender"];}
	};

	/** @return a speech object set up to read given text
	 * @param c.speechId the global id of speech
	 * @param c.text the text to read
	 * @param c.startIndex optional parameter, reading starts from this index - used when speech is used for error recovery
	 * @param c.lan the language of the text
	 * @param c.speed the speed of reading
	 * @param c.scheduleMarkers */
	tts.prepare = function(c) {
		var iSpeechVoice = getISpeechVoice({lan: c.lan || navigator.language, gender:c.gender});
		
		var speech = new Speech({speechId:c.speechId, text:c.text, startIndex:c.startIndex, iSpeechVoice:iSpeechVoice, speed:c.speed, scheduleMarkers:c.scheduleMarkers});
		return speech;
	}

	/** @param callback called with true if the tts is available; with false if failed */
	tts.test = function(callback) {
		var text = TtsTester.randomCommonEnglishWord();
		var iSpeechVoice = getISpeechVoice({lan:"en"});
		var url = UrlBuilder.build({text:text, iSpeechVoice:iSpeechVoice, action:"convert"});
		
		TtsTester.testHtmlAudio({url:url, callback:callback});
	}

	// =================================== iSpeechVoice ===================================
	
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
		return "usenglishfemale";	//TODO handle missing language
	}

	//this list was generated based on http://www.ispeech.org/api -> voices
	//there are duplicates, first wins in these cases
	var voices = [
		{lan:"en", dialect: "US", gender: "female", iSpeechVoice: "usenglishfemale"}
		,{lan:"en", dialect: "US", gender: "male", iSpeechVoice: "usenglishmale"}
		,{lan:"en", dialect: "GB", gender: "female", iSpeechVoice: "ukenglishfemale"}
		,{lan:"en", dialect: "GB", gender: "male", iSpeechVoice: "ukenglishmale"}
		,{lan:"en", dialect: "AU", gender: "female", iSpeechVoice: "auenglishfemale"}
		,{lan:"us", dialect: "", gender: "female", iSpeechVoice: "usenglishfemale"}
		,{lan:"us", dialect: "", gender: "male", iSpeechVoice: "usenglishmale"}
		,{lan:"gb", dialect: "", gender: "female", iSpeechVoice: "ukenglishfemale"}
		,{lan:"gb", dialect: "", gender: "male", iSpeechVoice: "ukenglishmale"}
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
	
	return tts;
});
