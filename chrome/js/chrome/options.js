require.config({
	baseUrl: "/../js/modules"
});

/** @param TestLines the text to show at the bottom of options page */
require([], function() {
	// ======================================== Read Event ========================================
	/** @return a callback that:
	 * 1. removes the "selected" class from all readEventSelectors
	 * 2. adds "selected" class to the node with selectedIndex index
	 * 3. sends setReadEvent
	 * @param readEventSelectors the nodelist (or array) that holds the elements to remove selected from
	 * @param selectedIndex the index of the node to add "selected" class
	*/
	function readEventSelectedCallback(readEventSelectors, selectedIndex) {
		return function() {
			for(var i=0; i<readEventSelectors.length; i++) {
				readEventSelectors[i].classList.remove("selected");
			}
			var readEventSelector = readEventSelectors[selectedIndex];
			readEventSelector.classList.add("selected");
			switch(readEventSelector.dataset.event) {
				case("mouseUp"): chrome.runtime.sendMessage({
					action:"webReader.setReadEvent",
					readEvent:"mouseUp"
				}); break;
				case("mouseDown"): chrome.runtime.sendMessage({
					action:"webReader.setReadEvent",
					readEvent:"mouseDown"
				}); break;
				case("keyboard"):
					//TODO keyboard
					alert("keyboard - not impelemented yet!");
					break;
			}
			
		}
	}
	
	var readEventSelectors = document.querySelectorAll("#readEventList li");
	for(var i=0; i<readEventSelectors.length; i++) {
		readEventSelectors[i].onclick = readEventSelectedCallback(readEventSelectors, i);
	}
	
	// ======================================== Speed Settings ========================================
	var speedNumber = document.getElementById("speedNumber");
	var speedRange = document.getElementById("speedRange");
	
	//set the initial value of the range
	chrome.runtime.sendMessage({action: "webReader.getSettings"}, function(settings) {
		speedNumber.value = settings.speed;
		speedRange.value = settings.speed;
		
		var readEventSelectors = document.querySelectorAll("#readEventList li");
		var selected = null;
		for(var i=0; i<readEventSelectors.length; i++) {
			if(readEventSelectors[i].dataset.event == settings.readEvent) {
				readEventSelectedCallback(readEventSelectors, i)();	//TODO: more straightforward?
			}
		}
	});

	speedNumber.onchange = function() {
		chrome.runtime.sendMessage({action: "webReader.setSpeed",speed: this.value});
		speedRange.value = this.value;
	}
	speedRange.oninput = function() {
		chrome.runtime.sendMessage({action: "webReader.setSpeed",speed: this.value});
		speedNumber.value = this.value;
	}
});