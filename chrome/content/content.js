/* this is a content script - it is attached to each opened webpage*/
(function() {
	//either null or readText
	var onClick;	//either null or readText
	var onSpace;	//either null or readTextAndPreventScroll
	
	var getTextToRead;	//either borwser-select or hovered paragraph
	var onReadingEvent;	//either animateClicked(readingEvent) or null
	
	// ============================================= hovered/clicked paragraph =============================================	
	var clickedElement = null;	//TODO maybe some nicer logic
	
	//elements can be highlighted based on their status: hovered|loading|playing|error
	var status2element = {};
	
	//element => {cakgroundColor,transition}
	var element2original = new Map();
	
	/** stores the current backgroundColor and tansition styles of given element */
	function saveOriginal(element) {
		if(element2original.get(element)) return;	//already saved
		element2original.set(element,{
			backgroundColor:element.style["background-color"]
			,transition:element.style["-webkit-transition"]
		});
	}
	
	/** @return concatenates statuses of given element with "-" in order hovered-loading-playing-error */
	function concatenatedStatus(element) {
		return ["hovered","loading","playing","error"].filter(function(status) {
			return status2element[status] === element;	//only inerested in statuses where element is given element
		}).join("-");
	}

	/** animates given element based on the status2element */
	function animate(element) {
		var status = concatenatedStatus(element);
		element.style["-webkit-transition"] = "background-color .2s ease-in-out";
		switch(status) {
			case("hovered"): 		element.style["background-color"] = "#4f4"; break;
			case("hovered-loading"):element.style["background-color"] = "#55f"; break;
			case("hovered-playing"):element.style["background-color"] = "#55f"; break;
			case("loading"): 		element.style["background-color"] = "#bbf"; break;
			case("playing"):		element.style["background-color"] = "#bbf"; break;
			//TODO others
			//TODO actual animation when loading
		}
	}
	
	/** adds @param status on @param element
	 * removes same status from other elements
	 * loading|playing|error are exclusive */
	function addStatus(element,status) {
		if(element && status2element[status] === element) return;	//all done
 
		//status is set on another element => revert first
		if(["loading","playing","error"].indexOf(status) > -1) {
			revert("loading");
			revert("playing");
			revert("error");
		} else revert(status);
 
		//if we removed status (added status to null) revert already set the original styles
		if(!element) return;
 
		status2element[status] = element;
		saveOriginal(element);
		animate(element);
	}
	
	/** reverts the highlighted element */
	function revert(status) {
		var element = status2element[status];
		if(!element) return;

		status2element[status] = null;	
		if(concatenatedStatus(element)) {
			//element still has some status, animate based on the new concatenated style
			animate(element);
			return;
		}
		
		var original = element2original.get(element);
		element.style["background-color"] = original.backgroundColor;
		window.setTimeout(function() {
			//if any style is set, we don't revert the the transition
			if(concatenatedStatus(element)) return;
			
			//otherwise we do, and also remove the original for given element
			element.style["-webkit-transition"] = original.transition;
			element2original.delete(element);
		}, 200);
	}
	
	/** sets the background of the hovered element AND removes the highlight of the previous hovered */
	function highlightHoveredElement() {
		addStatus(getHoveredParagraph(), "hovered");
	}
	
	function containsTextDirectly(element) {
		for(var i=0; i<element.childNodes.length; i++) {
			var child = element.childNodes[i];
			if(child.nodeType == Node.TEXT_NODE && /\S/.test(child.nodeValue)) return true;	//text node AND not empty
		}
		return false;
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
	
	/** @return the text in hovered element */
	function getHoveredParagraphText() {
		clickedElement = status2element.hovered;
		revert("loading");
		revert("playing");
		revert("error");
		
		highlightHoveredElement();
		if(status2element.hovered) return status2element.hovered.textContent;
		else return "";
	}
	
	// ============================================= animate clicked =============================================
	
	function animateClicked(readingEvent) {
		switch(readingEvent) {
			case("loading"): addStatus(clickedElement,"loading"); break;
			case("start"): addStatus(clickedElement,"playing"); break;
			case("end"): revert("playing"); break;
			case("error"): addStatus(clickedElement,"error"); break;
		}
	}

	// ============================================= browser select =============================================
	/** reads the selected area*/
	function getBrowserSelectedText() {
		return getSelection().toString();
	}
	
	// ============================================= read ============================================= 
	/** reads the text to be read (painted paragraph / selected text) */
	function readText() {
		chrome.runtime.sendMessage({
			action: "ClickAndSpeech.read",
			text: getTextToRead(),
			lan: document.documentElement.lang
		});
	}
	
	/** should be called with the "keydown" event when space is pressed
	 * reads text provided by getText(), and stops page scroll if the active element is an input*/
	function readTextAndPreventScroll(event) {
		var activeTagName = document.activeElement?document.activeElement.tagName:null;
		if(["INPUT","TEXTAREA"].indexOf(activeTagName) < 0) {
			readText();
			event.preventDefault();	//stop scrolling
		}
	}
	
	// ============================================= general =============================================

	/** 1. sets up getTextToRead function to either use hovered paragraph or browser-select
	 * 2. starts selecting the pointed paragraph when getHoveredParagraph given*/
	function setSelectEvent(selectEvent) {
		window.removeEventListener("mousemove", highlightHoveredElement);
		revert("hovered");

		switch(selectEvent) {
			case("hoveredParagraph"):
				window.addEventListener("mousemove", highlightHoveredElement);
				getTextToRead = getHoveredParagraphText;
				onReadingEvent = animateClicked;
				break;
			case("browserSelect"):
				getTextToRead = getBrowserSelectedText;
				onReadingEvent = null;
				break;
		}
	}

	/** to react when setting is changed in options*/
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			if(request.action == "ClickAndSpeech.event" && onReadingEvent) onReadingEvent(request.value);

			if(request.action != "ClickAndSpeech.set") return;
			console.log("received: " + request.setting + " " + request.value);
			switch(request.setting) {
				case("selectEvent"): setSelectEvent(request.value); break;
				case("readOnClick"): onClick = request.value?readText:null; break;
				case("readOnSpace"): onSpace = request.value?readTextAndPreventScroll:null; break;
			}
		}
	);

	chrome.runtime.sendMessage({action: "ClickAndSpeech.getSettings"}, function(response) {
		setSelectEvent(response.selectEvent);
		onClick = response.readOnClick?readText:null;
		onSpace = response.readOnSpace?readTextAndPreventScroll:null;
	});
	
	document.addEventListener("mousedown", function(){
		if(onClick) onClick();
	});
	document.addEventListener("keydown",function(event) {
		if(event.keyCode == 32 && onSpace) onSpace(event);
	});
})();