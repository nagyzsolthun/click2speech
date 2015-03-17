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
		var audios = [];

		Object.defineProperty(this, 'name', {get: function() {return readerConfig.name;}});
		Object.defineProperty(this, 'speed', {
			set: function(speed) {
				audios.forEach(function(audio) {
					audio.playbackRate = speed;
				});
			}
		});
		
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
		/** reads given text on given language (stops playing if already is playing)
		* @param c.text the text to be read
		* @param c.lan the language of reading
		* @param c.speed the speed of reading (defaults to 1)
		* @param c.onLoading called when loading started
		* @param c.onStart called when audio starts playing
		* @param c.onEnd called when playing finishes
		* @param c.onError called when error has raised
		*/
		this.read = function(c) {
			var that = this;	//TODO
			
			this.stop();
			c.onLoading();

			var urlArr = readerConfig.buildUrlArr(c);
			//TODO remove this stuff, its only for testing
			if(c.text == "this text will cause an error") {
				urlArr = ["muhahahahaerror"];
			}
			var cutEnd = readerConfig.getCutLength?readerConfig.getCutLength(c):null;
			urlArr.forEach(function(url, i) {
				var audio = new Audio();
				audio.defaultPlaybackRate = c.speed || 1;
				audio.src = encodeURI(url);
				audio.onerror = function(){
					that.stop();
					c.onError(audio.src);
				}
				audios.push(audio);
				if(cutEnd) setCutEnd({audio: audio,cutEnd: cutEnd});
				
				if(i==0) { //first element starts playing when onloadedData + executes onStart
					audio.oncanplay = function() {
						audio.play();
						c.onStart();
					}
				}
				else {	//other elements start playing after previous ends AND after their data loads
					audios[i-1].onended = function() {
						if(audio.readyState == 4) audio.play();
						else audio.oncanplay = audio.play;
					}
				}

				//last element ending should call onEnd
				if(i == urlArr.length-1) audio.onended = c.onEnd;
			});	//end forEach
		}; //end read
		
		/** stops playing the audio (not only pause!)*/
		this.stop = function() {
			audios.forEach(function(audio) {
				audio.onerror = null;
				audio.src = "";
				audio.load();
			});
			var last = audios[audios.length-1];
			last && last.onended();	//onEnd is called
			audios = [];
		}
		
		/** @param callback called with a boolean flag indicating if the test passed */
		this.test = function(callback) {
			var urlArr = readerConfig.buildUrlArr({
				text:(Date.now() % 1000).toString()	//a random text to send
				,lan: "en-US"
			});
			var audio = new Audio();
			audio.onerror = function() {
				callback(false);
			}
			audio.oncanplay = function() {
				callback(true);
			}
			audio.src = encodeURI(urlArr[0]);
		}
	}
	
	console.log("WebAudioReader initialized");
	return WebAudioReader;
});