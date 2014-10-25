/* this is a content script - it is attached to each opened webpage*/
function readCallback() {
	chrome.runtime.sendMessage({
		action: "webReader.read",
		textToSpeech: getSelection().toString(),
		languageOfDocument: document.documentElement.lang
	});
}

function setEventListener(readEvent) {
	document.removeEventListener("mousedown", readCallback);
	document.removeEventListener("mouseup", readCallback);
	//TODO keyboard
	
	switch(readEvent) {
		case("mouseDown"): document.addEventListener("mousedown", readCallback); break;
		case("mouseUp"): document.addEventListener("mouseup", readCallback); break;	//BUG: reads selection again when clicked
		//TODO keyboard
	}
}

/** to react when setting is changed in options*/
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(request.action == "webReader.setReadEvent") {
			console.log("received: " + request.readEvent);
			setEventListener(request.readEvent);
		}
	}
);

chrome.runtime.sendMessage({action: "webReader.getSettings"}, function(response) {
	setEventListener(response.readEvent);
});