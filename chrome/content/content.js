/* this is a content script - it is attached to each opened webpage*/
(function() {
	//this function is set depnding on the settings (non or readOnClick)
	function onClick() {
		console.log("onClick default - should not execute");
	}
	
	//this function is set depnding on the settings (browser-select OR hovered paragraph)
	var getTextToRead = function() {
		console.log("getTextToRead default - should not execute");
	};
	
	// ============================================= hovered paragraph =============================================
	var highlight = {backgroundColor: "#4f4",transition: "background-color .2s ease-in-out"}
	var original = {};
	var highlightedElement;
	
	function containsTextDirectly(element) {
		for(var i=0; i<element.childNodes.length; i++) {
			var child = element.childNodes[i];
			if(child.nodeType == Node.TEXT_NODE && /\S/.test(child.nodeValue)) return true;	//text node AND not empty
		}
		return false;
	}
	
	/** reverts the highlighted element */
	function revertHighlight() {
		if(!highlightedElement) return;

		highlightedElement.style["background-color"] = original.backgroundColor;
			
		//transition should be set back to original - but only after the transition is over
		//closure should hold thse values
		var element = highlightedElement;
		var originalTransition = original.transition;
		window.setTimeout(function() {
			element.style["-webkit-transition"] = originalTransition;
		}, 200);
		highlightedElement = null;
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
	
	/** sets the background of the highlighted element AND removes the highlight of the old highlighted */
	function highlightHoveredElement() {
		var hoveredElement = getHoveredParagraph();
		
		//the element is already highlighted
		if(hoveredElement && hoveredElement === highlightedElement) return;

		//the highlighted element is not the one as before - we don't need it to be highlighted anymore
		revertHighlight();

		if(! hoveredElement) return;

		highlightedElement = hoveredElement;
		original.transition = hoveredElement.style["-webkit-transition"];
		original.backgroundColor = hoveredElement.style["background-color"];
		highlightedElement.style["-webkit-transition"] = highlight.transition;
		highlightedElement.style["background-color"] = highlight.backgroundColor;
	}
	
	/** @return the text being pointed */
	function getHoveredParagraphText() {
		highlightHoveredElement();
		if(highlightedElement) return highlightedElement.textContent;
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

		window.removeEventListener("mousemove", highlightHoveredElement);
		revertHighlight();

		switch(selectEvent) {
			case("hoveredParagraph"):
				window.addEventListener("mousemove", highlightHoveredElement);
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