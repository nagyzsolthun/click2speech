/* this is a content script - it is attached to each opened webpage*/
(function() {
	//this function is set depnding on the settings (non or readOnClick)
	function onClick() {
		console.log("onClick default - should not execute");
	}
	
	//this function is set depnding on the settings (browser-select OR pointed paragraph)
	var getTextToRead = function() {
		console.log("getTextToRead default - should not execute");
	};
	
	// ============================================= pointed paragraph =============================================
	//TODO: make code look better
	var selectedBackGround = "#4f4";
	var selectedElement;
	var selectedOriginalBackground;
	
	function containsTextDirectly(element) {
		for(var i=0; i<element.childNodes.length; i++) {
			var child = element.childNodes[i];
			if(child.nodeType == Node.TEXT_NODE && /\S/.test(child.nodeValue)) {
				return true;	//if any child is text we won
			}
		}
		return false;
	}
	
	/** removes the background from the selected element and nulls it */
	function unselectSelectedElement() {
		if(selectedElement) { //selected element should not be selected anymore
			//in case something already changed the background color of the element, we don't bother with it (should't be usual)
			//if(selectedElement.style["background-color"] == selectedBackGround) {	//TODO: getter returns in rgb, we provide hex..
				selectedElement.style["background-color"] = selectedOriginalBackground;
			//}			
			selectedElement = null;
			selectedOriginalBackground = null;
		}
	}
	
	/** set selectedElement as the one the pointer points to IF the element contains text directly
	 * if it contains NO text directly, selectedElement is set as null*/
	function selectHoveredElement() {
		var hoveredElement = null;
		var hoveredNodes = document.querySelectorAll(":hover");
		if(hoveredNodes.length) {
			hoveredElement = hoveredNodes[hoveredNodes.length - 1];	//take the element on the deepest position
			//TODO not the last one, the first one that contains text directly
		}
		
		//the element is already selected
		if(hoveredElement && hoveredElement === selectedElement) return;

		//the selected element is not the one as before - we don't need it to be selected anymore
		unselectSelectedElement();

		//there is nothing under the pointer (prettymuch impossible)
		if(! hoveredElement) return;

		if(containsTextDirectly(hoveredElement)) {
			selectedElement = hoveredElement;
			selectedOriginalBackground = hoveredElement.style["background-color"];
			selectedElement.style["background-color"] = selectedBackGround;
		}
	}
	
	/** @return the text being pointed */
	function getPointedParagraphText() {
		selectHoveredElement();
		if(selectedElement) return selectedElement.textContent;
		else return "";
	}
	
	// ============================================= browser select =============================================
	/** reads the selected area*/
	function getBrowserSelectedText() {
		return getSelection().toString();
	}
	
	// ============================================= read and missed functions ============================================= 
	/** reads the text to be read (painted paragraph / selected text) */
	function readText() {
		console.log("read on click");
		chrome.runtime.sendMessage({
			action: "webReader.read",
			text: getTextToRead(),
			lan: document.documentElement.lang
		});
	}
	
	/** sends "missed" message to background */
	function sendMissed() {
		chrome.runtime.sendMessage({action: "webReader.missed"});
	}
	
	// ============================================= general =============================================
	
	/** sets up onClick function to start reading or send missed message */
	function setClickReadEventListener(enabled) {
		if(enabled) onClick = readText;
		else onClick = sendMissed;
	}

	/** 1. sets up getTextToRead function to either use pointed paragraph or browser-select
	 2. starts selecting the pointed paragraph when poitnedParagraph given*/
	function setSelectEventListener(selectEvent) {
		//TODO keyboard + click settings

		window.removeEventListener("mousemove", selectHoveredElement);
		unselectSelectedElement();

		switch(selectEvent) {
			case("pointedParagraph"):
				window.addEventListener("mousemove", selectHoveredElement);
				getTextToRead = getPointedParagraphText;
				break;
			case("browserSelect"):
				getTextToRead = getBrowserSelectedText;
				break;
		}
	}

	/** to react when setting is changed in options*/
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			if(request.action != "webReader.set") return;
			console.log("received: " + request.setting + " " + request.value);
			switch(request.setting) {
				case("selectEvent"):
					setSelectEventListener(request.value);
					break;
				case("readOnClick"):
					setClickReadEventListener(request.value);
					break;
				case("keyboardReadEvent"):
					//TODO
					break;
			}
		}
	);

	chrome.runtime.sendMessage({action: "webReader.getSettings"}, function(response) {
		setSelectEventListener(response.selectEvent);
		setClickReadEventListener(response.readOnClick);
		//TODO keyboard
	});
	
	//TODO make settings for this
	document.addEventListener("mousedown", function(){
		onClick();
	})
})();