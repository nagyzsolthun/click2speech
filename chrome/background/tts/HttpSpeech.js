import * as textSplitter from "./TextSplitter.js";

const DONOTHING = ()=>{};
function HttpSpeech(text,buildUrl,testLength,speed) {
    var textArr = [];
	var audioArr = [];

	// store audio event listeners for cleanUp
	var indexToEventToListeners = {};

    var startCallback = DONOTHING;
	var sentenceCallback = DONOTHING;
	var endCallback = DONOTHING;
	var errorCallback = DONOTHING;

    this.play = function() {
		if(audioArr.length) audioArr[0].play();   // check if audiArr is created (aka text is not empty)
        else endCallback();
	}
	this.stop = function() {
		cleanUp();
		endCallback();
	}
    this.onStart = function(callback) {
		startCallback = () => callback();
		return this;
	}
	this.onSentence = function(callback) {
		sentenceCallback = (startIndex) => callback(startIndex);
		return this;
	}
	this.onEnd = function(callback) {
		endCallback = () => {cleanUp(); callback();};
		return this;
	}
	this.onError = function(callback) {
		errorCallback = (startIndex) => {cleanUp(); callback(startIndex);};
		return this;
	}

    // init
    if(text) {
        textArr = textSplitter.split(text,testLength);
        prepareAudio(0);	// TODO empty text?
    }

	// send HttpRequests and add event listners
	function prepareAudio(audioIndex) {
		var audio = new Audio();
        audio.src = buildUrl(textArr[audioIndex]);
        audio.playbackRate = speed;
		audioArr.push(audio);

		addAudioEventListener(audioIndex, "playing", () => {
            if(isFirstAudio(audioIndex)) startCallback();
            if(isSentenceStart(audioIndex)) sentenceCallback(startIndex(audioIndex));
            removeAudioEventListeners(audioIndex, "playing");   // playing event may happen again
        });

		if(isLastAudio(audioIndex)) addAudioEventListener(audioIndex, "ended", () => endCallback());
        else addAudioEventListener(audioIndex, "playing", () => prepareAudio(audioIndex+1));	// TODO loading time?

		if(!isFirstAudio(audioIndex)) addAudioEventListener(audioIndex-1, "ended", () => audio.play());

        addAudioEventListener(audioIndex, "error", () => errorCallback(startIndex(audioIndex)));
	}

	// add listener to audio and to internal collection for cleanUp
	function addAudioEventListener(audioIndex, event, listener) {
		// audio
		audioArr[audioIndex].addEventListener(event,() => listener());

		// internal map
		var eventToListeners = indexToEventToListeners[audioIndex];
		if(!eventToListeners) {
			eventToListeners = {};
			indexToEventToListeners[audioIndex] = eventToListeners;
		}
		var listners = eventToListeners[event];
		if(!listners) {
			listners = [];
			eventToListeners[event] = listners;
		}
		listners.push(listener);
	}

    function removeAudioEventListeners(audioIndex, event) {
        var eventToListeners = indexToEventToListeners[audioIndex];
        var listeners = eventToListeners[event];
        if(listeners) {
            listeners.forEach(listener => audioArr[audioIndex].removeEventListener(event,listener));
            delete indexToEventToListeners[audioIndex];
        }
    }

    function isSentenceStart(audioIndex) {
        if(audioIndex == 0) {
            return true;
        }
        var previousText = textArr[audioIndex-1];
        return textSplitter.isSentence(previousText);
    }

    function startIndex(audioIndex) {
        return textArr
            .filter((text,index) => index < audioIndex)     // find texts before audioArr
            .reduce((sum,text) => sum+=text.length, 0);     // sum their lenghts
    }

	function isLastAudio(audioIndex) {
		return audioIndex == textArr.length - 1;
	}

    function isFirstAudio(audioIndex) {
        return audioIndex == 0;
    }

	function cleanUp() {
		audioArr.forEach( (audio,index) => {
            var eventToListeners = indexToEventToListeners[index];
            for(var event in eventToListeners) {
                var listeners = eventToListeners[event];
                listeners.forEach(listener => audio.removeEventListener(event,listener));
            }
			audio.pause();   // audio.src = "" => errorCallback when ended
		});
        audioArr = [];
	}
}

function buildHttpSpeech(text,buildUrl,testLength,speed) {
    return new HttpSpeech(text,buildUrl,testLength,speed);
}

export { buildHttpSpeech };
