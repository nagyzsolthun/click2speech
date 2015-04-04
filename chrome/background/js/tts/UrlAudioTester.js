//plays batch of audios defined by urls in sequential order
define(function() {
	UrlAudioTester = {};
	
	/** @param c.url the url to be tested
	 * @param c.callback called with true if the resource on @param c.url is accessable and is a palyable audio
	 * with false if failed */
	UrlAudioTester.test = function(c) {
		var audio = new Audio();
		audio.src = encodeURI(c.url);
		audio.oncanplay = function() {
			c.callback(true);
		}
		audio.onerror = function() {
			c.callback(false);
		}
	}
	return UrlAudioTester;
});