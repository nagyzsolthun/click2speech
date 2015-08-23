//plays batch of audios defined by urls in sequential order
define(function() {
	
	/** costructs an urlSpeech instance
	 * @param c.tts the name of the tts that provided the urls
	 * @param c.urlArr array of urls
	 * @param c.speed speed of speech
	 * @param c.cutEnd the length of audio to be ignored at the end (iSpeech "powered by iSpeech" sound)
	 * @param c.textArr array of text (urlArr[i] always have the url for textArr[i])*/
	function UrlSpeech(c) {
		var audios = {};
		var endListeners = {};	//end event listeners - to be able to remove them when manually stopped
		var loadingTimes = {};	//time passed until canplaythrough event received (seconds) - to know when to start loading of the next audio
		
		var speed = c.speed || 1;	//store in a variable - it may change later
		
		var onEvent = function() {};
		
		/** calls prepareAudio(i+1) when playing of audios[i] reaches a point where request should be sent
		 * OR fires "end" event when last audio ends */
		function scheduleNext(i) {
			var audio = audios[i];

			//audio is the last one => fire "end" event when over
			if(i > c.urlArr.length-2) {
				endListeners[i] = function() {onEvent({type:"end"})};
				audio.addEventListener("pause", endListeners[i]);
				return;
			}
			
			//audio is NOT the last one => prepare next when needed
			//when to send the request for the next audio? end - (1 sec + loadingTime x 2) seems good (considering speed)
			audio.addEventListener("timeupdate", function() {
				if(audios[i+1]) return;	//already prepared
				var audioTimeForLoading = (1 + loadingTimes[i]*2)*speed;
				if(audio.currentTime < audio.duration - (c.cutEnd || 0) - audioTimeForLoading) return;	//nothing to do yet
				prepareAudio(i+1);
			});
			
			//play next audio when this is over
			endListeners[i] = function() {play(i+1);}
			audio.addEventListener("pause", endListeners[i]);
		}
		
		/** creates an audio for the url on the @param i index, and sets up callbacks to create following audios
		 * @note: when this function is called, the browser sends a request*/
		function prepareAudio(i) {
			var audio = new Audio();
			audios[i] = audio;

			audio.defaultPlaybackRate = speed;
			audio.src = c.urlArr[i];

			//cutEnd			
			if(c.cutEnd) audios[i].addEventListener("timeupdate", function() {
				if(audios[i].currentTime > audios[i].duration - c.cutEnd) audios[i].pause();
			});

			//ladingTime - to know when to start loading of next audio
			var loadingStart = Date.now();
			audio.addEventListener("canplaythrough", function() {
				var loadingEnd = Date.now();
				loadingTimes[i] = (loadingEnd - loadingStart) / 1000.0;
			});
			
			//next
			scheduleNext(i);
		}
		
		/** starts audio in @param i index + sets up events (loading, start, error) */
		function play(i) {
			var audio = audios[i];

			if(audio.error) {
				handleUrlError(i);
				return;
			}
			audio.addEventListener("waiting", function() {
				onEvent({type:"loading"});
			});
			audio.addEventListener("playing", function() {
				onEvent({type:"start"});
			});
			audio.addEventListener("error", function(e) {
				handleUrlError(i);
			});

			audio.play();
		}
		
		// ================================ error handling ================================
		
		/** @return the text after the textArr on @param i index*/
		function remainingText(i) {
			var result = "";
			for(; i<c.textArr.length; i++) {
				result += c.textArr[i];
			}
			return result;
		}
		
		/** stops playing + calls onEvent with URL_ERROR, provides its necessary data: url, remaing text */
		function handleUrlError(i) {
			this.stop();
			onEvent({type:"error",errorType:"URL_ERROR",url:c.urlArr[i],remaining:remainingText(i)});
		}
		
		// ================================ public ================================
		
		/** starts playing when possible */
		this.play = function() {
			if(c.urlArr.length) play(0);
			else onEvent({type:"end"});
		}
		
		/** stops playing - NO event is fired */
		this.stop = function() {
			for(var i=0; i<c.urlArr.length; i++) {
				var audio = audios[i];
				if(!audio) continue;	//not prepared (manual stop befor prepare called)
				
				var endListener = endListeners[i];
				audio.removeEventListener("pause",endListener);
				audio.pause();
			};
		}
		
		/** called when an audio event is fired
		 * "loading" loading starts OR playing of audio can't be started because of still loading
		 * "start" when reading starts
		 * "end" the last audio finished playing
		 * "error" an error occured. it will always stop playing!*/
		Object.defineProperty(this, 'onEvent', {set: function(callback){onEvent = callback;}});
		Object.defineProperty(this, 'tts', {get: function() {return c.tts;}});
		Object.defineProperty(this, 'speed', {
			set: function(value) {
				speed = value;
				for(var i=0; i<c.urlArr.length; i++) {
					if(audios[i]) audios[i].playbackRate = speed;
				}
			}
		});
		
		// ================================ init ================================
		if(c.urlArr.length) prepareAudio(0);
	}

	return UrlSpeech;
});
