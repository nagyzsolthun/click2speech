document.onkeypress = function() {
	if(event.keyCode == 48)	{ //key '0' pressed
		var text = getSelection();
		chrome.runtime.sendMessage({textToSpeech: '"' + text + '"'}, function(response) {
			console.log(response.farewell);
		});
	}
}