//plays batch of audios defined by urls in sequential order
define(function() {
	var TtsTester = {};
	
	/** @param c.url the url to be tested
	 * @param c.callback called with true if the resource on @param c.url is accessable and is a palyable audio
	 * with false if failed */
	TtsTester.testHtmlAudio = function(c) {
		var audio = new Audio();
		audio.src = encodeURI(c.url);

		//TODO cleanup?
		audio.oncanplay = function() {
			c.callback(true);
		}
		audio.onerror = function() {
			c.callback(false);
		}
	}

	TtsTester.randomCommonEnglishWord = function() {
		return commonEnglishWords[Math.floor(Math.random()*commonEnglishWords.length)];
	}
	var commonEnglishWords = ['the','be','to','of','and','in','that','have','it','for','not','on','with','he','as','you','do','at'];

	return TtsTester;
});
