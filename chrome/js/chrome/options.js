require.config({
	baseUrl: "/../js/modules"
});

require([], function() {
	// ======================================== Select Event ========================================
	/** @return a callback that:
	 * 1. removes the "selected" class from all given elements (options)
	 * 2. adds "selected" class to the node with selectedIndex index
	 * 3. sends setSelectEvent
	 * @param options the nodelist (or array) that holds the elements to remove "selected" class from
	 * @param selectedIndex the index of the node to add "selected" class
	*/
	function onSelect(options, selectedIndex) {
		return function() {
			for(var i=0; i<options.length; i++) {
				options[i].classList.remove("selected");
			}
			var selectEventSelector = options[selectedIndex];
			selectEventSelector.classList.add("selected");
			switch(selectEventSelector.dataset.event) {	//TODO: this whole switch stuff is unnecessary
				case("pointedParagraph"): chrome.runtime.sendMessage({
					action:"webReader.setSelectEvent",
					selectEvent:"pointedParagraph"
				}); break;
				case("browserSelect"): chrome.runtime.sendMessage({
					action:"webReader.setSelectEvent",
					selectEvent:"browserSelect"
				}); break;
			}
			/*chrome.storage.local.clear(function() {
				alert("cleared storage");
			});*/
		}
	}
	
	var selectEventSelectors = document.querySelectorAll("#selectEventList li");
	for(var i=0; i<selectEventSelectors.length; i++) {
		selectEventSelectors[i].onclick = onSelect(selectEventSelectors, i);
	}
	
	// ======================================== Speed Settings ========================================
	var speedNumber = document.getElementById("speedNumber");
	var speedRange = document.getElementById("speedRange");

	speedNumber.onchange = function() {
		chrome.runtime.sendMessage({action: "webReader.setSpeed",speed: this.value});
		speedRange.value = this.value;
	}
	speedRange.oninput = function() {
		chrome.runtime.sendMessage({action: "webReader.setSpeed",speed: this.value});
		speedNumber.value = this.value;
	}
	
	// ======================================== init ========================================
	chrome.runtime.sendMessage({action: "webReader.getSettings"}, function(settings) {
		speedNumber.value = settings.speed;
		speedRange.value = settings.speed;
		
		var selectEventSelectors = document.querySelectorAll("#selectEventList li");
		for(var i=0; i<selectEventSelectors.length; i++) {
			if(selectEventSelectors[i].dataset.event == settings.selectEvent) {
				onSelect(selectEventSelectors, i).call();
				//TODO: more straightforward?
				//TODO: shouldn't send setSelectEvent in init case
			}
		}
	});
});