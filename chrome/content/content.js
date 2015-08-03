/* this is a content script - it is attached to each opened webpage*/
(function() {
	var settings = {};	//last cahnge of all settings
	var lastTtsEvent = null;	//to know whether esc event propagation should be stopped
	
	var onArrow;	//called when arrows are pressed, parameters: keyEvent, direction
	var onClick;	//called when mouse button is clicked
	var onMouseDown;	//called when mouse button is down - used fot built-in select, to make sure the click is an actual click and not a new selection-start
	var onMouseMove;	//called when the mouse pinter moves
	var onMouseUp;		//called when mouse buttin is up - used fot built-in select, to make sure the click is an actual click and not a new selection-start
	var onSpace;	//called when space is pressed with parameter: keyEvent
	var onEsc;	//called when esc key is pressed
	
	// ============================================= highlight =============================================	
	var requestedElement = null;	//the clicked|space-pressed element
	
	//elements can be highlighted based on their status: highlighted|loading|playing|error
	var status2element = {};
	
	//element => {cakgroundColor,transition}
	var element2original = new Map();
	
	/** stores the current backgroundColor and tansition styles of given element */
	function saveOriginal(element) {
		if(element2original.get(element)) return;	//already saved
		element2original.set(element,{
			backgroundColor:element.style["background-color"]
			,color: element.style["color"]
			,transition:element.style["-webkit-transition"]
			,cursor:element.style["cursor"]
		});
	}
	
	/** @return concatenates statuses of given element with "-" in order highlighted-loading-playing-error */
	function concatenatedStatus(element) {
		return ["highlighted","loading","playing","error"].filter(function(status) {
			return status2element[status] === element;	//only inerested in statuses where element is given element
		}).join("-");
	}

	/** animates given element based on the status2element */
	function animate(element) {
		var status = concatenatedStatus(element);
		element.style["-webkit-transition"] = "background-color .2s linear, color .2s linear";
		switch(status) {
			case("highlighted"):
				element.style["background-color"] = "#4f4";
				element.style["color"] = "black";
				if(settings.noDelegateFirstClick) element.style["cursor"] = "pointer";
				else element2original.get(element).cursor;
				break;
			case("loading"): 
			case("highlighted-loading"):
			case("playing"):
			case("highlighted-playing"):
				element.style["background-color"] = "#8f8";
				element.style["color"] = "black";
				element.style["cursor"] = element2original.get(element).cursor;
				break;
			case("error"):
			case("highlighted-error"):
				element.style["background-color"] = "#f55";
				element.style["color"] = "black";
				element.style["cursor"] = element2original.get(element).cursor;
				break;
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
		element.style["color"] = original.color;
		element.style["cursor"] = original.cursor;
		window.setTimeout(function() {
			//if any style is set, we don't revert the the transition
			if(concatenatedStatus(element)) return;
			
			//otherwise we do, and also remove the original for given element
			element.style["-webkit-transition"] = original.transition;
			element2original.delete(element);
		}, 200);
	}
	
	/** @return the text in highlighted element */
	function getHighlightedParagraphText() {
		if(status2element.highlighted) return status2element.highlighted.textContent;
		else return "";
	}
	
	// ============================================= highlighted element =============================================
	function containsTextDirectly(element) {
		for(var i=0; i<element.childNodes.length; i++) {
			var child = element.childNodes[i];
			if(child.nodeType == Node.TEXT_NODE && /\S/.test(child.nodeValue)) return true;	//text node AND not empty
		}
		return false;
	}
	
	// ============================================= hover highlight =============================================
	
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
	
	/** highlights the element under mouse pointer */
	function highlightHoveredElement() {
		if(isMouseMoveEventFromAutomaticScrolling()) return true;
		var element = getHoveredParagraph();
		addStatus(element, "highlighted");
	}
	
	// ============================================= keyboard navigation =============================================
	/** @return false if element has no content or is invisible to user */
	function hasVisibleContent(element) {
		if(!element) return false;
		if(!element.getBoundingClientRect) return false; //no getBoundingClientRect function: no content
		if(element === status2element.highlighted) return false;	//already highlighted
 
		var style = window.getComputedStyle(element);
		if(style["display"] === "none") return false;
		if(style["visibility"] === "hidden") return false;
		if(style["opacity"] === "0") return false;

		return true;
	}
	
	
	/** @return true if element is part of the page (its all edges are inside the page */
	function isOnPage(rect) {
		if(!rect.width || !rect.height) return false;	//e.g. google noscript element
		if(rect.top < -window.pageYOffset) return false;
		if(rect.left < -window.pageXOffset) return false;
		if(rect.bottom > document.body.scrollHeight-window.pageYOffset) return false;
		if(rect.right > document.body.scrollWidth-window.pageXOffset) return false;
		return true;
	}
	
	/** @param direction marks a path from @param fromRect: right|left: horizontal, up|down: vertical
	 * @return whether @param rect has any part on the selected path */
	function isOnPath(fromRect,rect,direction) {
		switch(direction){
			case("up"):
			case("down"):
				//equality: in case of tables, the top of underlying row is the same as bottom
				if(rect.right <= fromRect.left) return false;
				if(fromRect.right <= rect.left) return false;
				break;
			case("left"):
			case("right"):
				if(fromRect.bottom <= rect.top) return false;
				if(rect.bottom <= fromRect.top) return false;
				break;
		}
		return true;
	}
	
	/** @return offset of closest edges from @param rect1 to @param rect2 in @param direction */
	function getEdgeOffset(rect1,rect2,direction) {
		switch(direction) {
			case("up"): return rect1.top - rect2.bottom;
			case("down"): return rect2.top - rect1.bottom;
			case("left"): return rect1.left - rect2.right;
			case("right"): return rect2.left - rect1.right;
		}
	}
	
	/** @return distance between rect1.mid->direction and rect2.mid */
	function getAxisDist(rect1,rect2,direction) {
		var m1 = {x:(rect1.left + rect1.right)/2, y:(rect1.top + rect1.bottom)/2};
		var m2 = {x:(rect2.left + rect2.right)/2, y:(rect2.top + rect2.bottom)/2};
		switch(direction) {
			case("up"):
			case("down"): return Math.abs(m2.x-m1.x);
			case("left"):
			case("right"): return Math.abs(m2.y-m1.y);
		}
	}
	
	/** @return size of @param rect on the line perpendicular to @param direction */
	function getPathWidth(rect,direction) {
		switch(direction) {
			case("up"):
			case("down"): return rect.width;
			case("left"):
			case("right"): return rect.height;
		}
	}

	/** @return the object considered closer 
	 * @param o1 o2 {element,edgeOffset,onPath,relWidth,axisDist}
	 * priority: onPath>edgeOffset>axisDist*/
	function closer(o1,o2,pathWidth) {
		if(!o1) return o2;
		if(!o2) return o1;
		
		//pathWidth: the wider the element (perpendicular to direction) is, the more weight onPath has
		var weightedDist1 = o1.edgeOffset/100 + o1.axisDist/1000 - (o1.onPath?pathWidth:0);
		var weightedDist2 = o2.edgeOffset/100 + o2.axisDist/1000 - (o2.onPath?pathWidth:0);
		
		return (weightedDist1 < weightedDist2)?o1:o2;
	}
	
 	/** @return the readableElement considered the closest to given fromRect in given direction
	 * @param fromRect the rect to which the closest is searched
	 * @param direction up|down|left|right the direction of search*/
	function getClosestReadableElement(fromRect, direction) {
		var result; //element,edgeOffset,onPath,relWidth,axisDist
		var pathWidth = getPathWidth(fromRect,direction);
		var viewRect = {top: 0,bottom: window.innerHeight,left:0,right: window.innerWidth};
		
		/** recursive function to update the result with given element (if needed) */
		function updateResult(element) {
			if(!hasVisibleContent(element)) return;
			if(!containsTextDirectly(element)) {	//doesn't contain text directly => explore children
				for(var i=0; i<element.childNodes.length; i++) updateResult(element.childNodes[i]);
				return;
			}
			
			//contains text directly => compare to current result
			var range = document.createRange();
			range.selectNodeContents(element);
			var textRect = range.getBoundingClientRect();

			if(!isOnPage(textRect)) return;	//e.g. top left element on google for screen-readers
			if(!isOnPath(viewRect,textRect,direction)) return;	//when stepping left|right we don't want to search elements under|above the view
			
			var edgeOffset = getEdgeOffset(fromRect,textRect,direction);
			if(edgeOffset < 0) return;
			
			var onPath = isOnPath(fromRect,textRect,direction);	
			var axisDist = getAxisDist(fromRect,textRect,direction);
			result = closer(result,{element:element,edgeOffset:edgeOffset,onPath:onPath,axisDist:axisDist},pathWidth);
		}
		updateResult(document.documentElement);	//call it on the root element
		return result?result.element:null;
	}
	
	function getDocumentBoundingClientRect() {
		var result = {
			top: -window.pageYOffset
			,bottom: document.body.scrollHeight-window.pageYOffset
			,left:-window.pageXOffset
			,right: document.body.scrollWidth-window.pageXOffset
			,width: document.body.scrollWidth
			,height: document.body.scrollHeight-2*window.pageYOffset
		};
		return result;
	}
	
	/** @return the boundingClientRect of the currently higlighted|loading|playing|error element
	 * if no such element: return a rect representing the edge of the page:
	 * up: bottom edge | down: top edge | left: right edge | right: left edge*/
	function getStepFromRect(direction) {
		var activeElement = null;
		if(status2element.loading) activeElement = status2element.loading;
		if(status2element.playing) activeElement = status2element.playing;
		if(status2element.error) activeElement = status2element.error;
		if(status2element.highlighted) activeElement = status2element.highlighted;
		if(activeElement) {
			var range = document.createRange();
			range.selectNodeContents(activeElement);
			return range.getBoundingClientRect();
		}

		//dimensions of the page relative to view
		result = getDocumentBoundingClientRect();
		switch(direction) {
			case("up"): result.top = result.bottom; break;
			case("down"): result.bottom = result.top; break;
			case("left"): result.left = result.right; break;
			case("right"): result.right = result.left; break;
			//default: wont reach
		}
		return result;
	}
	
	var lastScroll = 0;	//time of last scrolling caused by stepping (to prevent unnecessary onMouseMove event)
	function scrollIntoView(element) {
		var scroll = {x:0,y:0};
		
		var rect = element.getBoundingClientRect();
		if(rect.top < 0) scroll.y += rect.top;
		if(rect.bottom > window.innerHeight) scroll.y += rect.bottom-window.innerHeight;
		if(rect.left < 0) scroll.x += rect.left;
		if(rect.right > window.innerWidth) scroll.x += rect.right-window.innerWidth;

		if(scroll.x || scroll.y) {
			window.scrollBy(scroll.x, scroll.y);
			lastScroll = Date.now();
		}
	}
	/** when using the arrow keys and we step out of the view, there is an automatic scrolling, which fires a mousemove event
	 * @return true if the mouseMove event is beause of the automatic scrolling */
	function isMouseMoveEventFromAutomaticScrolling() {
		return (Date.now() - lastScroll) < 500;	//the usual value is around 100ms
	}
	
	/** highlights element in @param direction from currently highlighted element */
	function stepHighlight(keyEvent, direction) {
		keyEvent.stopPropagation();	//other event listeners won't execute
		keyEvent.preventDefault();	//stop scrolling

		var fromRect = getStepFromRect(direction);
		var closestReadable = getClosestReadableElement(fromRect, direction);

		if(!closestReadable) return;
		addStatus(closestReadable,"highlighted");
		scrollIntoView(closestReadable);

		chrome.runtime.sendMessage({action: "stepHighlight"}, null);
		
		//createDivOnBoundingClientRect(closestReadable);
	}
	
	//created for debugging
	var div = null;
	function createDivOnBoundingClientRect(rect) {
		if(div) {
			div.parentElement.removeChild(div);
		}
		
		div = document.createElement("div");
		div.style.position = "absolute";
		div.style.left = rect.left + window.scrollX + "px";
		div.style.top = rect.top + window.scrollY + "px";
		div.style.width = rect.right - rect.left + "px";
		div.style.height = rect.bottom - rect.top + "px";
		div.style.backgroundColor = "rgba(0,0,255,0.5)";
		div.id = "highlightId";
		document.documentElement.appendChild(div);
	}

	// ============================================= read =============================================

	/** reads the text given by getTextToRead callback (highlighted paragraph / selected text) */
	function readText(text) {
		chrome.runtime.sendMessage({action: "read",text: text,lan: document.documentElement.lang});
	}

	// ============================================= read - browser select =============================================
	var mouseDownText = null;

	/** saves the text in the moment of mousedown, to be able to read on mouseUp, when selection is already empty */	
	function saveBrowserSelectedText() {
		mouseDownText = getSelection().toString();
	}
	
	/** should be called with mouseUp - checks if this mouse event is the end of a click and not the end of a selection action */
	function readBrowserSelectedText() {
		window.setTimeout(function() {
			if(!getSelection().toString()) readText(mouseDownText);	//if this is a click, getSelection returns "", if this is the end of a selection, it returns the selection
		}, 0);	//if we dont set the timeout, getSelection will return text even if this was just a click (sometimes)
	}
	
	/** reads text provided by getBrowserSelectedText, and stops page scroll if the active element is an input*/
	function readBrowserSelectedTextAndPreventScroll(event) {
		var text = getSelection().toString();
		if(text || isLoadingOrReading()) {
			readText(text);
			event.preventDefault();	//stop scrolling
		}
	}
	
	// ============================================= read - highlighted =============================================
	
	/** reads text provided by getHighlightedParagraphText + stops click event delegation if needed */
	function readHighLightedText(event) {
		//empty area clicked => stop reading
		if(status2element.highlighted == null) {
			readText(getHighlightedParagraphText());	//reads empty text => stops reading
			return;
		}
	
		//the requested element is being read|loading|error
		var activeElements = [status2element.loading,status2element.playing,status2element.error];
		if(activeElements.indexOf(status2element.highlighted) > -1) {
			return;
		}

		//the requested element is NOT being read|loading|error
		requestedElement = status2element.highlighted;
		readText(getHighlightedParagraphText());
			
		//check if click event needs to be delegated
		if(settings.noDelegateFirstClick) {
			event.stopPropagation();
			event.preventDefault();
		}
	}
	
	/** should be called with the "keydown" event when space is pressed
	 * reads text provided by getHighlightedParagraphText, and stops page scroll if the active element is an input*/
	function readHighLightedTextAndPreventScroll(event) {
		requestedElement = status2element.highlighted;
		var text = getHighlightedParagraphText();
		if(text || isLoadingOrReading()) {
			readText(text);
			event.preventDefault();	//stop scrolling
		}
	}
	
	// ============================================= general =============================================
	
	//animates clicked|playing|error element
	function onTtsEvent(ttsEvent) {
		lastTtsEvent = ttsEvent;
		switch(ttsEvent.type) {
			case("loading"): addStatus(requestedElement,"loading"); break;
			case("start"): addStatus(requestedElement,"playing"); break;
			case("end"): addStatus(null,"playing"); break;	//reverts loading, playing, error
			case("error"): addStatus(requestedElement,"error"); break;
		}
	}
	
	//sets behavior of the content script based on the settings cache
	function digestSettings() {
		//turned off
		if(! settings.turnedOn) {	
			onArrow = null;
			onClick = null;
			onMouseDown = null;
			onMouseMove = null;
			onSpace = null;
			revert("highlighted");
			requestedElement = null;	//otherwise loading + reading event would color it
			return;
		}
		
		//selectType: builtInSelect
		if(settings.selectType == "builtInSelect") {
			onArrow = null;
			onClick = null;
			onMouseDown = saveBrowserSelectedText;
			onMouseMove = null;
			onMouseUp = readBrowserSelectedText
			onSpace = readBrowserSelectedTextAndPreventScroll;
			revert("highlighted");
			requestedElement = null;	//otherwise loading + reading event would color it
		}
		
		if(settings.selectType == "highlightSelect") {
			onArrow = settings.highlightOnArrows?stepHighlight:null;
			onClick = readHighLightedText;
			onMouseDown = null;
			onMouseMove = highlightHoveredElement;
			onMouseUp = null;
			onSpace = readHighLightedTextAndPreventScroll;
		}
	}
	
	function onMessage(request, sender, sendResponse) {
		switch(request.action) {
			case("event"): onTtsEvent(request.event); break;
			case("set"):
				settings[request.setting] = request.value;
				digestSettings();
				break;
		}
	}
	/** to react when setting is changed in options or when event is received*/
	chrome.runtime.onMessage.addListener(onMessage);
	
	/** @return true if the active element is an input area */
	function isUserTyping() {
		var activeElement = document.activeElement;
		if(activeElement) {
			if(activeElement.tagName.toLowerCase() == "input") return true;
			if(activeElement.tagName.toLowerCase() == "textarea") return true;
			if(activeElement.isContentEditable) return true;	//gmail new email
		}
		return false;
	}
	
	/** @return true if the last tts event is loading or start */
	function isLoadingOrReading() {
		return ["start","loading"].indexOf(lastTtsEvent.type) > -1;
	}
	
	function stopReading(keyEvent) {
		chrome.runtime.sendMessage({action: "read",text:""});
		keyEvent.stopPropagation();	//other event listeners won't execute
	}
	
	window.addEventListener("mousemove", function(event) {if(onMouseMove) onMouseMove(event);});
	window.addEventListener("click", function(event) {if(onClick) onClick(event);}, true);	//useCapture to have better chances that to execute first - so it can stop event propagation
	window.addEventListener("mousedown", function(event) {if(onMouseDown) onMouseDown(event);}, true);	//useCapture to have better chances to execute first - so it can stop event propagation
	window.addEventListener("mouseup", function(event) {if(onMouseUp) onMouseUp(event);}, true);	//useCapture to have better chances to execute first - so it can stop event propagation

	window.addEventListener("keydown", function(event) {
		//TODO this executes even if turned off
		switch(event.keyCode) {
			case(32):
			case(37):
			case(38):
			case(39):
			case(40): if(isUserTyping()) return; break;	//space | left | up | right | down
			case(27): if(!isLoadingOrReading()) return;	//esc: only handle reading|loading
		}
	
		switch(event.keyCode) {
			case(32): if(onSpace) onSpace(event);			break;
			case(37): if(onArrow) onArrow(event, "left");	break;
			case(38): if(onArrow) onArrow(event, "up");		break;
			case(39): if(onArrow) onArrow(event, "right");	break;
			case(40): if(onArrow) onArrow(event, "down");	break;
			case(27): stopReading(event);					break;
		}
	}, true);	//useCapture to have better chances that this listener executes first - so it can stop event propagation
	
	//initial setup
	chrome.runtime.sendMessage({action: "getSettings"}, function(storedSettings) {
		settings.turnedOn = storedSettings.turnedOn;
		settings.selectType = storedSettings.selectType;
		settings.highlightOnArrows = storedSettings.highlightOnArrows;
		settings.noDelegateFirstClick = storedSettings.noDelegateFirstClick;

		digestSettings();
	});
	chrome.runtime.sendMessage({action: "getLastTtsEvent"}, function(event) {
		lastTtsEvent = event;
	});
})();

