require([], function() {
	var turnedOn = null;

	function turnOn() {
		turnedOn = true;
		document.body.className = "tts-on";
		document.getElementById('onoffbutton').innerHTML = "turn off";
	}

	function turnOff() {
		turnedOn = false;
		document.body.className = "tts-off";
		document.getElementById('onoffbutton').innerHTML = "turn on";
	}

	document.getElementById('onoffbutton').addEventListener('click', function(){
		if(turnedOn) {
			turnOff();
			chrome.runtime.sendMessage({action: "webReader.turnOff"});
		} else {
			turnOn();
			chrome.runtime.sendMessage({action: "webReader.turnOn",});
		}
	});

	chrome.runtime.sendMessage({action: "webReader.getSettings"}, function(settings) {
		if(settings.turnedOn) {
			turnOn();
		} else {
			turnOff();
		}
	});
});