define([], function() {

	const TTS_URL_BASE = "https://text-to-speech-demo.mybluemix.net/api/synthesize";

	var result = {};

	/** @return the url of Watson TTS
	 * @param c.text
	 * @param c.WatsonVoice */
	result.build = function(c) {
		return TTS_URL_BASE + "?text=" + encodeURIComponent(c.text) + "&voice=" + c.WatsonVoice;
	}

	return result;

});
