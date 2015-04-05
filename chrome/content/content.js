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
			if(child.nodeType == Node.TEXT_NODE && /\S/.test(child.nodeValue)) return true;	//text node AND not empty
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
	
	/** @return the hovered paragraph
	 * the top element that contains text directly
	 * there are elements inside a text in many cases (e.g. <i> in wikipedia articles)
	 * we want to select the whole paragraph even if this inside element is hovered*/
	function getHoveredParagraph() {
		var hoveredNodes = document.querySelectorAll(":hover");
		for(var i=0; i<hoveredNodes.length; i++) {
			var element = hoveredNodes[i];
			if(containsTextDirectly(element)) return element;
		}
		return null;
	}
	
	/** set selectedElement as the one the pointer points to IF the element contains text directly
	 * if it contains NO text directly, selectedElement is set as null*/
	function selectHoveredElement() {
		var hoveredElement = getHoveredParagraph();
		
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
	function getHoveredParagraphText() {
		selectHoveredElement();
		if(selectedElement) return selectedElement.textContent;
		else return "";
	}
	
	// ============================================= browser select =============================================
	/** reads the selected area*/
	function getBrowserSelectedText() {
		return getSelection().toString();
	}
	
	// ============================================= read ============================================= 
	/** reads the text to be read (painted paragraph / selected text) */
	function readText() {
		console.log("read on click");
		chrome.runtime.sendMessage({
			action: "webReader.read",
			text: getTextToRead(),
			lan: document.documentElement.lang
		});
	}
	
	// ============================================= general =============================================
	
	/** sets up onClick function to start reading */
	function setClickReadEvent(enabled) {
		if(enabled) onClick = readText;
	}

	/** 1. sets up getTextToRead function to either use hovered paragraph or browser-select
	 * 2. starts selecting the pointed paragraph when getHoveredParagraph given*/
	function setSelectEvent(selectEvent) {
		//TODO keyboard + click settings

		window.removeEventListener("mousemove", selectHoveredElement);
		unselectSelectedElement();

		switch(selectEvent) {
			case("hoveredParagraph"):
				window.addEventListener("mousemove", selectHoveredElement);
				getTextToRead = getHoveredParagraphText;
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
				case("selectEvent"): setSelectEvent(request.value); break;
				case("readOnClick"): setClickReadEvent(request.value); break;
				case("keyboardReadEvent"): break;	//TODO
			}
		}
	);

	chrome.runtime.sendMessage({action: "webReader.getSettings"}, function(response) {
		setSelectEvent(response.selectEvent);
		setClickReadEvent(response.readOnClick);
		//TODO keyboard
	});
	
	document.addEventListener("mousedown", function(){
		onClick();
	})
})();