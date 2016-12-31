define(["tts/Watson/Speech", "tts/Watson/UrlBuilder", "tts/TtsTester"], function(Speech, UrlBuilder, TtsTester) {

	var tts = {
		get name() {return "IBM Watson";}
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
		var voice = getWatsonVoice({lan: c.lan || navigator.language, gender:c.gender});
		
		var speech = new Speech({speechId:c.speechId, text:c.text, startIndex:c.startIndex, WatsonVoice:voice, speed:c.speed, scheduleMarkers:c.scheduleMarkers});
		return speech;
	}

	/** @param callback called with true if the tts is available; with false if failed */
	tts.test = function(callback) {
		var text = TtsTester.randomCommonEnglishWord();
		var voice = getWatsonVoice({lan:"en"});
		var url = UrlBuilder.build({text:text, WatsonVoice:voice});
		
		TtsTester.testHtmlAudio({url:url, callback:callback});
	}
	
	/** @return true if @param lan has any matching WatsonVoice */
	tts.supportedLanguage = function(lan) {
		return (getWatsonVoice({lan:lan}) != null);
	}

	// =================================== WatsonVoice ===================================
	
	/** @return the Watson voice name for given parameters
	 * @param c.lan html iso language lan-DIALECT
	 * @param c.gender the preferred gender (male/female) */
	function getWatsonVoice(c) {
		var lan = c.lan.split("-")[0];
		var dialect = c.lan.split("-")[1];
		var result,

		//lan + dialect + gender match
		result = voices.filter(function(voice) {return voice.lan == lan && voice.dialect == dialect && voice.gender == c.gender});
		if(result[0]) return result[0].WatsonVoice;
		
		//lan + dialect match
		result = voices.filter(function(voice) {return voice.lan == lan && voice.dialect == dialect});
		if(result[0]) return result[0].WatsonVoice;
	   
		//lan + gender match
		result = voices.filter(function(voice) {return voice.lan == lan && voice.gender == c.gender});
		if(result[0]) return result[0].WatsonVoice;
	   
		//lan match
		result = voices.filter(function(voice) {return voice.lan == lan});
		if(result[0]) return result[0].WatsonVoice;
		
		return null;
	}

	//this list was generated based on https://www.ibm.com/watson/developercloud/doc/text-to-speech/http.shtml#voices
	//there are duplicates, first wins in these cases
	var voices = [
		{lan:"de"					,gender: "female"	,WatsonVoice: "de-DE_BirgitVoice"}
		,{lan:"de"					,gender: "male"		,WatsonVoice: "de-DE_DieterVoice"}
		,{lan:"en"	,dialect: "GB"						,WatsonVoice: "en-GB_KateVoice"}
		,{lan:"en"	,dialect: "US"	,gender: "female"	,WatsonVoice: "en-US_AllisonVoice"}	//TODO check other voice
		,{lan:"en"	,dialect: "US"	,gender: "male"		,WatsonVoice: "en-US_MichaelVoice"}
		,{lan:"es"	,dialect: "ES"	,gender: "male"		,WatsonVoice: "es-ES_EnriqueVoice"}
		,{lan:"es"	,dialect: "ES"	,gender: "female"	,WatsonVoice: "es-ES_LauraVoice"}
		,{lan:"es"	,dialect: "LA"						,WatsonVoice: "es-LA_SofiaVoice"}
		,{lan:"es"	,dialect: "US"						,WatsonVoice: "es-US_SofiaVoice"}
		,{lan:"fr"										,WatsonVoice: "fr-FR_ReneeVoice"}
		,{lan:"it"										,WatsonVoice: "it-IT_FrancescaVoice"}
		,{lan:"ja"										,WatsonVoice: "ja-JP_EmiVoice"}
		,{lan:"pt"										,WatsonVoice: "pt-BR_IsabelaVoice"}
	];
	
	return tts;
});
