/* this is a content script - it is attached to each opened webpage*/
(function() {
	/** when clicking while a text is selected we expect the thext NOT to be selected when mouseUp is fired
	 * which is important when stopping speech
	 * this is not always the case => we wait 10ms when mouseUp is fired before checking selection */
	function mouseUpCallback() {
		setTimeout(function() {
			chrome.runtime.sendMessage({
				action: "webReader.read",
				text: getSelection().toString(),
				languageOfDocument: document.documentElement.lang
			});
		}, 10);
	}
	
	/** reads the selected area*/
	function mouseDownCallback() {
		chrome.runtime.sendMessage({
			action: "webReader.read",
			text: getSelection().toString(),
			languageOfDocument: document.documentElement.lang
		});
	}

	function setEventListener(readEvent) {
		document.removeEventListener("mousedown", mouseDownCallback);
		document.removeEventListener("mouseup", mouseUpCallback);
		//TODO keyboard
	
		switch(readEvent) {
			case("mouseDown"):document.addEventListener("mousedown", mouseDownCallback);break;
			case("mouseUp"):document.addEventListener("mouseup", mouseUpCallback);break;
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
})();