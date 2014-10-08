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
			chrome.runtime.sendMessage({action: "tts-turnOff"});
		} else {
			turnOn();
			chrome.runtime.sendMessage({action: "tts-turnOn"});
		}
	});

	chrome.runtime.sendMessage({action: "tts-getStatus"}, function(response) {
		if(response.turnedOn) {
			turnOn();
		} else {
			turnOff();
		}
	});
});