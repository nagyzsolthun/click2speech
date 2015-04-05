//plays batch of audios defined by urls in sequential order
define(function() {
	
	/** costructs an urlSpeech instance
	 * @param c.tts the name of the tts that provided the urls
	 * @param c.urlArr array of urls
	 * @param c.speed speed of speech
	 * @param c.cutEnd the length of audio to be ignored at the end (iSpeech "powered by iSpeech" sound)
	 * @param c.textArr array of text (urlArr[i] always have the url for textArr[i])*/
	function UrlSpeech(c) {
		var audios = [];
		var audioErrors = {};
		var onEvent = function() {};

		/** sets the url for each audio, and wires up sequence:
		 * one audio should start after previous finishes and itself is loaded
		 * except the first one that starts only when play() is valled*/
		c.urlArr.forEach(function(url,i) {
			var audio = new Audio();
			audios.push(audio);
			
			audio.defaultPlaybackRate = c.speed || 1;
			audio.src = encodeURI(url);
			audio.onerror = function() {audioErrors[i] = true;}
			
			setCutEnd({audio:audio, cutEnd: c.cutEnd});

			//not the first audio => start playing when previous ends
			var previous = audios[i-1];
			if(previous) previous.onended = function() {playWhenPossible(i);}
			
			//last audio
			if(i == c.urlArr.length-1) audio.onended = function() {onEvent({type:"end"});}
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
			stop();
			onEvent({type:"error",errorType:"URL_ERROR",url:c.urlArr[i],remaining:remainingText(i)});
		}
		
		/** starts audio in @param i index if it can play, or waits until it is able to play */
		function playWhenPossible(i) {
			if(audioErrors[i]) {
				handleUrlError(i);
				return;
			}
			
			var audio = audios[i];
			if(audio.readyState == 4) {
				audio.play();	//audio can play
				return;
			}

			onEvent({type:"loading"});
			audio.oncanplay = function() {audio.play();onEvent({type:"start"});}
			audio.onerror = function() {
				handleUrlError(i);
			}
		}
		
		/** stops playing - no "end" event raised*/
		function stop() {
			audios.forEach(function(audio) {
				audio.onerror = null;
				audio.src = "";
				audio.load();
			});
			audios = [];
		}
		
		/** starts playing when possible */
		this.play = function() {
			if(!audios.length) {	//in case we received no text
				onEvent({type:"end"});
				return;
			}
			playWhenPossible(0);
		}
		
		/** stops playing the audio + raises "end" callback */
		this.stop = function() {
			var last = audios[audios.length-1];
			last && last.onended();
			stop();
		}
		
		/** called when any event arises
		 * "loading" loading starts OR playing of audio can't be started because of still loading
		 * "start" when reading starts
		 * "end" the last audio finished playing
		 * "error" an error occured. it will always stop playing!*/
		Object.defineProperty(this, 'onEvent', {set: function(callback){onEvent = callback;}});
		Object.defineProperty(this, 'tts', {get: function() {return c.tts;}});
		Object.defineProperty(this, 'speed', {
			set: function(speed) {
				audios.forEach(function(audio) {
					audio.playbackRate = speed;
				});
			}
		});
	}

	return UrlSpeech;
});