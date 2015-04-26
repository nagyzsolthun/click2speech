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
	//one status is set on max one element
	var statusMap = {
		hovered:	{element:null,original:{backgroundColor:null,transition:null}}
		,loading:	{element:null,original:{backgroundColor:null,transition:null}}
		,playing:	{element:null,original:{backgroundColor:null,transition:null}}
		,error:		{element:null,original:{backgroundColor:null,transition:null}}
	}
	
	/** @return concatenates statuses of given element with "-" in order hovered-loading-playing-error */
	function concatenatedStatus(element) {
		return ["hovered","loading","playing","error"].filter(function(status) {
			return statusMap[status].element === element;	//only inerested in statuses where element is given element
		}).join("-");
	}

	/** animates given element based on the statusMap */
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
	
	/** @return the copy of stored original, if a status is already given to @param element
	 * otherwise returns the current styles of the element */
	function getOriginal(element) {
		//the first status the element has - if any
		var status = ["hovered","loading","playing","error"].filter(function(s) {
			return statusMap[s].element === element;
		})[0];

		//if any found we return its original
		if(status) return {backgroundColor:statusMap[status].original.backgroundColor,transition:statusMap[status].original.transition};
 
		//otherwise return the current styles
		return {backgroundColor:element.style["background-color"], transition:element.style["-webkit-transition"]};
	}
	
	/** adds @param status on @param element
	 * removes same status from other elements
	 * loading|playing|error are exclusive */
	function addStatus(element,status) {
		if(element && statusMap[status].element === element) return;	//all done
 
		//status is set on another element => revert first
		if(["loading","playing","error"].indexOf(status) > -1) {
			revert("loading");
			revert("playing");
			revert("error");
		} else revert(status);
 
		//if we removed status (added status to null) revert already set the original styles
		if(!element) return;
 
		statusMap[status].original = getOriginal(element);	//we should first set original, since getOriginal() searches by element
		statusMap[status].element = element;
		
		animate(element);
	}
	
	/** reverts the highlighted element */
	function revert(status) {
		var element = statusMap[status].element;
		if(!element) return;
		
		var originalBackgroundColor = statusMap[status].original.backgroundColor
		var originalTransition = statusMap[status].original.transition

		statusMap[status].element = null;
		statusMap[status].original = null;
		
		if(concatenatedStatus(element)) {
			//element still has some status, lets not revert its style, but aniamte again
			animate(element);
			return;
		}
		
		element.style["background-color"] = originalBackgroundColor;
		window.setTimeout(function() {
			element.style["-webkit-transition"] = originalTransition;
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
		clickedElement = statusMap.hovered.element;
		revert("loading");
		revert("playing");
		revert("error");
		
		highlightHoveredElement();
		if(statusMap.hovered.element) return statusMap.hovered.element.textContent;
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