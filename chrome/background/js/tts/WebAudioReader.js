//provides a class that plays audio returned by given array of URLs, executes a callback when error raises
define(function() {
	
	/** creates a webAudioReader
	 * @param readerConfig.name name of the webAudioReader
	 * @param readerConfig.buildReadingParts function that creates array of ReadingParts
	 * 		@return readingPart.text the text
	 * 		@return readingPart.url the url
	 * 		@return readingPart.cutEnd the length of audio to be ignored at the end (iSpeech "powered by iSpeech" sound)
	 * 
	 * 		@param text the whole text
	 * 		@param lan the language
	 */
	function WebAudioReader(readerConfig) {
		var readingParts = [];
		var audios = [];
		var errorAudios = {};	//map: audio => true if the audio encountured error

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
			if(!c.cutEnd) return;
			c.audio.ontimeupdate = function() {
				if(c.audio.currentTime > c.audio.duration - c.cutEnd) {
					c.audio.onerror = null;
					c.audio.src = "";
					c.audio.onended();
				}
			}
		}
		
		/** audio starts playing when its loading finsihed
		 * @param c.audio the audio
		 * @param c.onLoading called in this function
		 * @param c.onStart called when audio starts playing
		 * @param c.onError called when error occured */
		function setupLoadingAudio(c) {
			c.onLoading();
			c.audio.oncanplay = function() {c.audio.play();c.onStart();}
			c.audio.onerror = function() {stop();c.onError();}	//TODO remaning text
		}
		
		/** stops playing */
		function stop() {
			audios.forEach(function(audio) {
				audio.onerror = null;
				audio.src = "";
				audio.load();
			});
			audios = [];
			errorAudios = {};
		}
		
		/** @return the text after the part on i index*/
		function remainingText(i) {
			var result = "";
			for(; i<readingParts.length; i++) {
				result += readingParts[i].text;
			}
			return result;
		}
		
		/** @return a function that calls @param c.callback with the following values:
		 * 		cause: "URL_ERROR"
		 * 		url: url of part with index @param c.i
		 * 		remaining: the remaining text to play*/
		function createUrlError(c) {
			return function() {
				var part = readingParts[c.i];
				c.callback({cause:"URL_ERROR",url:part.url,remaining:remainingText(c.i)});
			}
		}
		
		function setUpTest() {
			readingParts = [];
			readingParts.push({
				text: "google"
				,url: "https://translate.google.co.uk/translate_tts?q=google&tl=en-US"
			});
			readingParts.push({
				text: "iSpeech is set up to read a longer sentence"
				,url: "http://www.ispeech.org/p/generic/getaudio?text=iSpeech is set up to read a longer sentence&voice=usenglishfemale&speed=0&action=convert"
			});
			readingParts.push({
				text: "something random"
				,url: "https://github.com/nagyzsolthun/WebReader"
			});
			readingParts.push({
				text: "google again"
				,url: "https://translate.google.co.uk/translate_tts?q=google&tl=en-US"
			});
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
		* 	@param url the url that caused the error
		*	TODO remaining text
		*/
		this.read = function(c) {
			this.stop();
			c.onLoading();
			
			readingParts = readerConfig.buildReadingParts({text: c.text, lan:c.lan});
			
			//setUpTest();
			
			readingParts.forEach(function(part, i) {
				var previous = audios[i-1];
				
				var audio = new Audio();
				audios.push(audio);
				
				audio.defaultPlaybackRate = c.speed || 1;
				audio.src = encodeURI(part.url);
				setCutEnd({audio:audio, cutEnd: part.cutEnd});
				
				//set up onError callback with the urls and remaning text
				var urlError = createUrlError({callback:c.onError, i:i});
			
				//first audio
				if(!previous) setupLoadingAudio({audio:audio, onLoading:c.onLoading, onStart:c.onStart, onError: urlError});
				else {
					//not first audio
					audio.onerror = function() {
						errorAudios[part.url] = true;
					}
					previous.onended = function() {
						if(errorAudios[part.url]) {
							stop();
							urlError();
							return;
						}
						if(audio.readyState == 4) audio.play();	//audio can play
						else setupLoadingAudio({audio:audio, onLoading:c.onLoading, onStart:c.onStart, onError: urlError});	//still loading
					}
				}
				
				//last audio
				if(i == readingParts.length-1) audio.onended = c.onEnd;
			});
		};
		
		/** stops playing the audio (not only pause!)*/
		this.stop = function() {
			var last = audios[audios.length-1];
			last && last.onended();	//onEnd is called
			stop();
		}
		
		/** @param callback called with a boolean flag indicating if the test passed */
		this.test = function(callback) {
			var readingParts = readerConfig.buildReadingParts({
				text:(Date.now() % 1000).toString()	//a random text to send
				,lan: "en-US"
			});
			var audio = new Audio();
			audio.onerror = function() {callback(false);}
			audio.oncanplay = function() {callback(true);}
			audio.src = encodeURI(readingParts[0].url);
		}
	}
	
	console.log("WebAudioReader initialized");
	return WebAudioReader;
});