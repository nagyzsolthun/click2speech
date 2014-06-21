chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch(request.action) {
			case("tts-turnedOn"):
				document.body.className = "tts-on";
				document.getElementById('onoffbutton').innerHTML = "turn off";
				break;
			case("tts-turnedOff"):
				document.body.className = "tts-off";
				document.getElementById('onoffbutton').innerHTML = "turn on";
				break;
		}
	}
);

document.getElementById('onoffbutton').addEventListener('click', function(){
	chrome.runtime.sendMessage({action: "tts-turnOnOff"});
});