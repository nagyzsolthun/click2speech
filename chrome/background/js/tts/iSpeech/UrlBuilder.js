define([], function() {

	const TTS_URL_BASE = "http://www.ispeech.org/p/generic/getaudio";

	var result = {};

	/** @return the url of iSpeech TTS
	 * @param c.text
	 * @param c.iSpeechVoice
	 * @param. c.action convert|markers */
	result.build = function(c) {
		return TTS_URL_BASE + "?text=" + encodeURIComponent(c.text) + "&voice=" + c.iSpeechVoice + "&speed=-1&action=" + c.action;
	}

	return result;

});
