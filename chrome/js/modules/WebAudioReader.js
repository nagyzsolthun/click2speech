//plays audio returned by given array of URLs, executes a callback when error raises
define(function() {
	var speed = 1;
	var audios = [];
	
	var onStart = function() {};	//executed when playing starts
	var onEnd = function() {};	//executed when playing ends

	/**returns the URLs that will provide the audio files - should be set in other modules
	 * @param text
	 * @param lan the language of the document */
	var buildUrlArr = null;
	
	/** returns the time to stop playing audios before end - should be set in other modules
	 * @param text
	 * @param lan the language of the document */
	var getCutLength = function(c) {return null;};
	
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

	var reader = {
		set onStart(callback) {onStart = callback || function() {};}
		,set onEnd(callback) {onEnd = callback || function() {};}
		,set buildUrlArr(callback) {buildUrlArr = callback;}
		,set getCutLength(callback) {getCutLength = callback;}
	};
	
	/** reads given text on given language (stops playing if already is playing)
	 * @param c.text the text to be read
	 * @param c.lan the language of reading */
	reader.read = function(c) {
		reader.stop();
		
		if(! c.text) return;
		var urlArr = buildUrlArr(c);
		var cutEnd = getCutLength(c);

		urlArr.forEach(function(url, i) {
			var audio = new Audio();
			audio.defaultPlaybackRate = speed;
			audio.src = encodeURI(url);
			audios.push(audio);
			if(cutEnd) setCutEnd({audio: audio,cutEnd: cutEnd});
			
			//first element starts playing when onloadedData + executes onStart
			if(i==0) audio.oncanplay = function() {
				audio.play()
				onStart();
			}
			else {	//other elements start playing after previous ends AND after their data loads
				audios[i-1].onended = function() {
					if(audio.readyState == 4) audio.play();
					else audio.oncanplay = audio.play;
				}
			}

			//last element should call onEnd
			if(i == urlArr.length-1) {
				audio.onended = onEnd;
			}
		});
	};
	
	/** stops playing the audio (not only pause!)*/
	reader.stop = function() {
		audios.forEach(function(audio) {
			audio.pause();
			audio.src = "";
		});
		audios = [];
		onEnd();
	}
	
	/** sets the speed of playing */
	reader.setSpeed = function(newSpeed) {
		speed = newSpeed;
		for(var i=0; i<audios.length; i++) {
			audios[i].playbackRate = speed;
		}
	}
	
	return reader;
});