//plays audio returned by given array of URLs, executes a callback when error raises
define(function() {
	var speed = 1;
	var audios = [];
	
	var onStart = function() {};	//executed when playing starts
	var onEnd = function() {};	//executed when playing ends
	
	/** sets up @param c.audio to stop before the end by @param c.cutEnd */
	function setCutEnd(c) {
		c.audio.ontimeupdate = function() {
			//console.log("current: " + c.audio.currentTime);
			//console.log("duration: " + c.audio.duration);
			//console.log("cutEnd: " + c.cutEnd);
			if(c.audio.currentTime > c.audio.duration - c.cutEnd) {
				c.audio.src = "";
				c.audio.onended();
			}
		}
	}

	var player = {
		set onStart(callback) { onStart = callback || function() {};}
		,set onEnd(callback) { onEnd = callback || function() {};}
	};
	
	/** plays audios in urlArr one after each other
	 * @param c.urlArr the text to be read
	 * @param c.cutEnd audio is stopped before the end by given seconds TODO implement this
	 */
	player.read = function(c) {
		player.stop();

		c.urlArr.forEach(function(url, i) {
			var audio = new Audio();
			audio.defaultPlaybackRate = speed;
			audio.src = url;
			audios.push(audio);
			if(c.cutEnd) setCutEnd({audio: audio,cutEnd: c.cutEnd});
			
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
			if(i == c.urlArr.length-1) {
				audio.onended = onEnd;
			}
		});
	};
	
	/** stops playing the audio (not only pause!)*/
	player.stop = function() {
		audios.forEach(function(audio) {
			audio.pause();
			audio.removeAttribute("src");
		});
		audios = [];
		onEnd();
	}
	
	/** sets the speed of playing */
	player.setSpeed = function(newSpeed) {
		speed = newSpeed;
		for(var i=0; i<audios.length; i++) {
			audios[i].playbackRate = speed;
		}
	}
	
	return player;
});