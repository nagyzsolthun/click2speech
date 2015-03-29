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
		
		/** set up an audio file: plays after previous one ends and when its loading finishes
		 * @param c.previous the previous audio in the squence
		 * @param c.cutEnd (optional) stop before end of playing by this value
		 * @param c.url the url of the audio
		 * @param c.speed the speed of reading
		 * @param c.onLoading called when loading starts
		 * @param c.onStart called when an audio starts playing
		 * @param c.onError called when the currently playing/loading audio has encountured error
		 * 	@param url the url that caused the error
		 */
		function createAudio(c) {
			var audio = new Audio();
			audio.defaultPlaybackRate = c.speed || 1;
			audio.src = encodeURI(c.url);
			setCutEnd({audio:audio, cutEnd: c.cutEnd});
			
			//first audio
			if(!c.previous) setupLoadingAudio({audio:audio, onLoading:c.onLoading, onStart:c.onStart, onError: c.onError});
			else {
				//not first audio
				audio.onerror = function() {errorAudios[c.url] = true;}
				c.previous.onended = function() {
					if(errorAudios[c.url]) {stop();c.onError(); return;}	//TODO remaning text
					if(audio.readyState == 4) audio.play();	//audio can play
					else setupLoadingAudio({audio:audio, onLoading:c.onLoading, onStart:c.onStart, onError: c.onError});	//still loading
				}
			}
			
			return audio;
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
			
			var urlArr = readerConfig.buildUrlArr(c);
			
			//TODO remove these
			//urlArr = [];
			//urlArr.push("https://translate.google.co.uk/translate_tts?q=google&tl=en-US");
			//urlArr.push("http://www.ispeech.org/p/generic/getaudio?text=iSpeech is set up to read a longer sentence&voice=usenglishfemale&speed=0&action=convert");
			//urlArr.push("https://github.com/nagyzsolthun/WebReader");
			
			
			var cutEnd = readerConfig.getCutLength?readerConfig.getCutLength({lan:c.lan}):null;
			urlArr.forEach(function(url, i) {
				var audio = createAudio({
					previous: audios[i-1]
					,cutEnd:cutEnd
					,url:url
					,speed:c.speed
					,onLoading:c.onLoading
					,onStart:c.onStart
					,onError:c.onError
				});
				audios.push(audio);
			});	
			audios[audios.length-1].onended = c.onEnd;
		};
		
		/** stops playing the audio (not only pause!)*/
		this.stop = function() {
			var last = audios[audios.length-1];
			last && last.onended();	//onEnd is called
			stop();
		}
		
		/** @param callback called with a boolean flag indicating if the test passed */
		this.test = function(callback) {
			var urlArr = readerConfig.buildUrlArr({
				text:(Date.now() % 1000).toString()	//a random text to send
				,lan: "en-US"
			});
			var audio = new Audio();
			audio.onerror = function() {callback(false);}
			audio.oncanplay = function() {callback(true);}
			audio.src = encodeURI(urlArr[0]);
		}
	}
	
	console.log("WebAudioReader initialized");
	return WebAudioReader;
});