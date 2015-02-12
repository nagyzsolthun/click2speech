//provides a class that plays audio returned by given array of URLs, executes a callback when error raises
define(function() {
	
	/** creates a webAudioReader
	 * @param c.name name of the webAudioReader
	 * @param c.buildUrlArr function that creates the urls that will be played squentially
	 * 	@param text
	 * 	@param lan the language of the document
	 * @param c.getCutLength function that returns the length of audio to be ignored at the end (iSpeech "powered by iSpeech" sound)
	 * 	@param text
	 * 	@param lan the language of the document
	 */
	function WebAudioReader(readerConfig) {
		var speed = 1;
		var audios = [];
		
		var onStart = function() {};	//executed when playing starts
		var onEnd = function() {};	//executed when playing ends
		var onError = function(url, code) {};	//executed when error occours

		Object.defineProperty(this, 'name',		{get: function() {return readerConfig.name;}});
		Object.defineProperty(this, 'onStart',	{set: function(callback) {onStart = callback;}});
		Object.defineProperty(this, 'onEnd',	{set: function(callback) {onEnd = callback;}});
		Object.defineProperty(this, 'onError',	{set: function(callback) {onError = callback;}});		
		
		/** sets up @param c.audio to stop before the end by @param c.cutEnd */
		function setCutEnd(c) {
			c.audio.ontimeupdate = function() {
				if(c.audio.currentTime > c.audio.duration - c.cutEnd) {
					c.audio.src = "";
					c.audio.onended();
				}
			}
		}
		
		// ======================================= public =======================================
		this.set = function(setting, value) {
			switch(setting) {
				case("speed"):
					speed = value;
					audios.forEach(function(audio) {audio.playbackRate = speed;});
					break;
			}
		}
		
		/** reads given text on given language (stops playing if already is playing)
		* @param c.text the text to be read
		* @param c.lan the language of reading */
		this.read = function(c) {
			this.stop();
			
			if(! c.text) return;
			var urlArr = readerConfig.buildUrlArr(c);
			//TODO remove this stuff, its only for testing
			if(c.text == "this text will cause an error") {
				urlArr = ["muhahahahaerror"];
			}
			var cutEnd = readerConfig.getCutLength?readerConfig.getCutLength(c):null;

			urlArr.forEach(function(url, i) {
				var audio = new Audio();
				audio.defaultPlaybackRate = speed;
				audio.src = encodeURI(url);	
				audio.onerror = onError(audio.src);
				audios.push(audio);
				if(cutEnd) setCutEnd({audio: audio,cutEnd: cutEnd});
				
				//first element starts playing when onloadedData + executes onStart
				if(i==0) audio.oncanplay = function() {audio.play(); onStart();}
				else {	//other elements start playing after previous ends AND after their data loads
					audios[i-1].onended = function() {
						if(audio.readyState == 4) audio.play();
						else audio.oncanplay = audio.play;
					}
				}
				//last element should call onEnd
				if(i == urlArr.length-1) audio.onended = onEnd;
			});	//end forEach
		}; //end read
		
		/** stops playing the audio (not only pause!)*/
		this.stop = function() {
			audios.forEach(function(audio) {
				audio.pause();
				audio.src = "";
			});
			audios = [];
			onEnd();
		}
	}
	
	console.log("WebAudioReader initialized");
	return WebAudioReader;
});