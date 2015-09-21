/* this is a content script - it is attached to each opened webpage*/
(function() {
	// ============================================= simulate Map for older chrome versions =============================================
	Map = (typeof Map != 'undefined') ? Map : function() {
		var keys = [];
		var values = [];
		
		//array.indexOf compares toString()
		function indexOfKey(key) {
			for(var i=0; i<keys.length; i++) {
				if(keys[i] === key) return i;
			}
			return -1;
		}
		
		this.get = function(key) {
			var i = indexOfKey(key);
			return values[i];
		}
		this.set = function(key, value) {
			var i = indexOfKey(key);
			if(i < 0) {	//doesnt contains
				keys.push(key);
				values.push(value);
				return;
			}
			values[i] = value;
		}
		this.delete = function(key) {
			var i = indexOfKey(key);
			if(i > -1) {
				keys.splice(i, 1);
				values.splice(i, 1);
			}
		}
	}

	// ============================================= some attributs =============================================
	var settings = {};	//current settings
	
	var lastTtsEventType = null;
	
	function nothing() {};	//used when no event listener needed
	
	var onArrow;	//called when arrows are pressed, parameters: keyEvent, direction
	var onSpace;	//called when space is pressed with parameter: keyEvent
 	var onSelectingMouseMove;	//called when mouse pointer moves while selection is happening
 	var onNonSelectingMouseMove;	//called when mouse pointer moves while selection is NOT happening
 	var onSelectingMouseUp;	//called when mouseUp while selection is happening
 	var onNonSelectingMouseUp;	//called when mouseUp while selection is NOT happening
	
	// ============================================= status =============================================
	var highlightedElement = null;	//hovered OR arrow selected
	var requestedElement = null;	//clicked OR space-pressed element - colored when tts events received
	
	//element => {background, backgroundColor, color, transition}
	var element2original = new Map();
	
	/** saves the current style of @param element */
	function saveOriginal(element) {
		if(element2original.get(element)) return;	//already saved
		element2original.set(element,{
			background:element.style["background"]	//this overrides background-color => set to none (e.g. google search result top-right login button)
			,backgroundColor:element.style["background-color"]
			,color: element.style["color"]
			,transition:element.style["-webkit-transition"]
		});
	}
	
	/** @return true if click event has listener on the element
	 * unfortunately there is no direct way to check this, so I created a blacklist here */
	function isClickable(element) {
		if(!element) return false;

		if(element.tagName.toLowerCase() == "a") return true;
		if(element.tagName.toLowerCase() == "button") return true;
		if(element.getAttribute("type") == "button") return true;
		if(element.hasAttribute("ng-click")) return true;	//angular
		if(element.classList.contains("btn")) return true;	//boostrap
		if(getComputedStyle(element).cursor == "pointer") return true;	//many pages, e.g. gmail
		
		if(window.location.hostname == "mail.google.com") {
			if(element.getAttribute("role") == "button") return true;	//gmail compose button
		}
 
		return false;
	}
	
	/** @return the status of @param element
	 * status can be:
	 * 1) highlighted-(clickable|nonclickable)
	 * 2) (loading|reading|error)
	 * 3) highlighted-(clickable|nonclickable)-(loading|reading|error)*/
	function getStatus(element) {
		var result = [];
		if(highlightedElement === element) {
			result.push("highlighted");
			result.push(isClickable(element)?"clickable":"nonclickable");
		}
		if(lastTtsEventType && requestedElement === element) result.push(lastTtsEventType);
		return result.join("-");
	}
	
	/** sets original style of element + remvoes it from element2original */
	function revertStyle(element) {
		var original = element2original.get(element);
		element.style["background"] = original.background;
		element.style["background-color"] = original.backgroundColor;
		element.style["color"] = original.color;
		window.setTimeout(function() {
			//if any status is set (e.g. user hovered element before timeout), we don't revert the the transition
			if(getStatus(element)) return;
			
			//otherwise we do, and also remove the original for given element
			element.style["-webkit-transition"] = original.transition;
			element2original.delete(element);
		}, 200);
	}
	
	/** sets the style of @param element
	 * or reverts if it has no status */
	function setStyle(element) {
		if(!element) return;
		if(!element2original.get(element)) saveOriginal(element);
		
		var status = getStatus(element);
		if(!status) {
			revertStyle(element);
			return;
		}
		
		//set actual style
		element.style["-webkit-transition"] = "background .2s, background-color .2s, color .2s";	//'background' transition doesn't seem to work
		element.style["background"] = "none";
		element.style["color"] = "black";
		
		var backgroundColor = element2original.get(element).backgroundColor;
		switch(status) {
			case("highlighted-nonclickable"): backgroundColor = "#4f4"; break;
			case("highlighted-clickable"): backgroundColor = "#ccc"; break;
			case("loading"):
			case("start"): backgroundColor = "#bbf"; break;
			case("highlighted-nonclickable-loading"):
			case("highlighted-nonclickable-start"):
			case("highlighted-clickable-loading"):
			case("highlighted-clickable-start"): backgroundColor = "#88f"; break;
			case("error"): backgroundColor = "#fbb"; break;
			case("highlighted-nonclickable-error"):
			case("highlighted-clickable-error"): backgroundColor = "#f88"; break;
			//the default case is reached many times too: if lastTtsEventType is end and we start reading, the type stays end..
		}
		element.style["background-color"] = backgroundColor;
	}
	
	/** sets highlightedElement to be the @param element + cleans up */
	function setHighlighted(element) {
		if(highlightedElement === element) return;
		
		var oldHighlightedElement = highlightedElement;
		highlightedElement = element;
		
		setStyle(oldHighlightedElement);
		setStyle(highlightedElement);
	}
	
	/** sets requestedElement to be the @param element + cleans up */
	function setRequested(element) {
		var oldRequestedElement = requestedElement;
		requestedElement = element;

		setStyle(oldRequestedElement);
		setStyle(requestedElement);
	}
	
	// ============================================= highlight general =============================================
	
	/** @return true if @param element is an input area*/
	function isInputElement(element) {
		if(element) {
			if(element.tagName.toLowerCase() == "input") return true;
			if(element.tagName.toLowerCase() == "textarea") return true;
			if(element.isContentEditable) return true;	//gmail new email
		}
		return false;
	}

	/** @return true if element has any textNode direct children */
	function containsReadableTextDirectly(element) {
		if(isInputElement(element)) return false;	//not readable element
	
		//check all nodes of the element - if any node is text + contains actual text (not only whitespaces or brackets) we return true
		for(var i=0; i<element.childNodes.length; i++) {
			var child = element.childNodes[i];
			if(child.nodeType != Node.TEXT_NODE) continue;	//this is not a text node, continue searching
			
			var text = child.nodeValue;
			if(! /\S/.test(text)) continue;	//text doesn't contain non-white space character
			if(! /[^\[\]]/.test(text)) continue; //this is quite usual on wikipedia
			return true;
		}
		return false;
	}
	
	/** @return true if elements contains anything else then text nodes (even indirectly) */
	function containsNonTextIndirectly(element) {
		if(!element.childNodes.length) return true;
		
		if(window.location.hostname == "www.facebook.com") {
			if(element.classList.contains("jewelButton")) return true;	//fb friend requests, messages, notifications
		}

		for(var i=0; i<element.childNodes.length; i++) {
			var child = element.childNodes[i];
			switch(child.nodeType) {
				case(Node.ELEMENT_NODE): if(containsNonTextIndirectly(child)) return true; break;
				case(Node.TEXT_NODE): continue; break;
				default: return true;
			}
		}
		return false;
	}
	
	function removeHighlight() {
		setHighlighted(null);
	}
	
	// ============================================= keyboard navigation =============================================
	/** @return false if element has no content or is invisible to user */
	function hasVisibleContent(element) {
		if(!element) return false;
		if(!element.getBoundingClientRect) return false; //no getBoundingClientRect function: no content
 
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
			if(element === highlightedElement) return;	//already highlighted
			if(!hasVisibleContent(element)) return;
			if(!containsReadableTextDirectly(element)) {	//doesn't contain text directly => explore children
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
		var activeElement = requestedElement || highlightedElement;
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
	function isAutomaticScrollingRecent() {
		return (Date.now() - lastScroll) < 500;	//the usual value is around 100ms
	}
	
	/** highlights element in @param direction from currently highlighted element */
	function stepHighlight(keyEvent, direction) {
		keyEvent.stopPropagation();	//other event listeners won't execute
		keyEvent.preventDefault();	//stop scrolling

		var fromRect = getStepFromRect(direction);
		var closestReadable = getClosestReadableElement(fromRect, direction);

		if(!closestReadable) return;
		setHighlighted(closestReadable);
		scrollIntoView(closestReadable);

		chrome.runtime.sendMessage({action: "stepHighlight"}, null);
		
		//createDivOnBoundingClientRect(closestReadable);
	}
	
	//created for debugging
	var div = null;
	function createDivOnBoundingClientRect(rect) {
		if(div) div.parentElement.removeChild(div);
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
	
	// ============================================= hovered =============================================
	
	/** @return the deepest clickable element from @param nodes */
	function getDeepestClickableElement(nodes) {
		for(var i=nodes.length-1; i>-1; i--) {
			var element = nodes[i];
			if(isClickable(element)) return element;
		}
		return null;
	}
	
	function getTopReadableElement(nodes) {
		for(var i=0; i<nodes.length; i++) {
			var element = nodes[i];
			if(containsReadableTextDirectly(element)) return element;
		}
		return null;
	}
	
	function getHoveredReadableElement() {
		var hoveredNodes = document.querySelectorAll(":hover");
		var clickable = getDeepestClickableElement(hoveredNodes);
		if(clickable) return containsNonTextIndirectly(clickable)?null:clickable;	//so we don't return with clickable images or huge clickable elements (e.g. youtube video)
		return getTopReadableElement(hoveredNodes);
	}
	
	/** highlights the element under mouse pointer */
	function highlightHoveredElement() {
		var element = getHoveredReadableElement();
		setHighlighted(element);
	}
	
	// ============================================= read =============================================

	/** sends "read" message with @param text
	 * @param source is hovered|space|esc */
	function readText(text, source) {
		chrome.runtime.sendMessage({action: "read",text: text,lan: document.documentElement.lang, source:source});
	}
	
	/** @return the text in highlighted element */
	function getHighlightedElementText() {
		return highlightedElement?highlightedElement.textContent:"";
	}

	/** reads text of hovered element */
	function readHoveredNonClickable() {
		highlightHoveredElement();
		if(isClickable(highlightedElement)) {
			readText("", "hoveredClickableClick");
			return;
		}
		setRequested(highlightedElement);
		readText(getHighlightedElementText(), "hoveredClick");
	}
	
	/** reads the text provided by browserSelect */
	function readBrowserSelected() {
		setRequested(null);	//so tts events don't color arrowSelected element
		readText(getSelection().toString(), "browserSelect");
	}
	
	/** stops reading + sets source as "browserSelected" */
	function stopBrowserSelected() {
		readText("", "browserSelect");
	}
	
	/** reads highlighted text + prevents scrolling */
	function readHighlightedAndPreventScroll(event) {
		setRequested(highlightedElement);
		var highlightedText = getHighlightedElementText();
		
		//stop default behavior if: there is highlighted text OR reading is happening
		if(highlightedText || ["loading","start","error"].indexOf(lastTtsEventType) > -1) {
			readText(highlightedText, "space");
			event.preventDefault();	//stop scrolling
		}
	}
	
	// ============================================= internal events =============================================
	
	//animates clicked|playing|error element
	function onTtsEvent(ttsEvent) {
		lastTtsEventType = ttsEvent.type;
		switch(ttsEvent.type) {
			case("end"): setRequested(null);
			case("loading"):
			case("reading"):
			case("error"): setStyle(requestedElement);
		}
	}
	
	//sets behavior of the content script based on the settings cache
	function digestSettings() {
		if(! settings.turnedOn) {
			onSelectingMouseMove	= nothing;
			onNonSelectingMouseMove	= nothing;
			onSelectingMouseUp		= nothing;
			onNonSelectingMouseUp	= nothing;
			onArrow					= nothing;
			onSpace					= nothing;
			setRequested(null);	//reverts loading, playing, error
			setHighlighted(null);	//revertsd highlighted
			return;
		}
		
		onArrow = settings.arrowSelect ? stepHighlight : nothing;
		
		onSelectingMouseMove = settings.hoverSelect ? removeHighlight : nothing;
		onNonSelectingMouseMove = settings.hoverSelect ? highlightHoveredElement : nothing;
		onSelectingMouseUp = settings.browserSelect ? readBrowserSelected : nothing;

		onNonSelectingMouseUp = settings.browserSelect ? stopBrowserSelected : nothing;
		onNonSelectingMouseUp = settings.hoverSelect ? readHoveredNonClickable : onNonSelectingMouseUp;
		
		onSpace = (settings.hoverSelect || settings.arrowSelect) ? readHighlightedAndPreventScroll : nothing;
		if(!settings.hoverSelect && !settings.arrowSelect) setHighlighted(null);
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
	chrome.runtime.onMessage.addListener(onMessage);
	
	/** if reading: stops reading and cancels event; otherwise reverts highlight (if any) and cancels event
	 * if no reading, neither highlight => nothing*/
	function stopReadingOrRevertHighlight(keyEvent) {
		if(["loading","start","error"].indexOf(lastTtsEventType) > -1) {
			readText("", "esc");
			keyEvent.stopPropagation();
			return;
		}
		if(highlightedElement) {
			setHighlighted(null);
			keyEvent.stopPropagation();
		}
	}
	
	/** @return true if the active element is an input area */
	function isUserTyping() {
		var activeElement = document.activeElement;
		return isInputElement(activeElement);
	}
	
	// ============================================= browserSelect decisions =============================================
	var mouseUpTime = 0;
	var mouseDownTime = 0;
	function saveMouseUpTime() {mouseUpTime = Date.now();}
	function saveMouseDownTime() {mouseDownTime = Date.now();}
	function isMouseButtonBeingPressed() {return mouseUpTime < mouseDownTime;}
	function recentMouseUp() {return Date.now() - 300 < mouseUpTime;}
	
	/** selecting means: getSelection() returns something + mouse button being pressed or mouseUp happened recently
	 * recent mouseUp: e.g. browserSelecting while hoverSelect is on => when slecting is over, we dont want the highlight to appear right away*/
	function isSelecting() {
		if(!getSelection().toString()) return false;	//no text is selected => user is not selecting anything
		if(isMouseButtonBeingPressed()) return true;	//this is important when checking on mouseMove
		if(recentMouseUp()) return true;	//no hover right after selecting is over
		return false;
	}
	
	/** @param selectCallback is called in case selecting is happening
	 * @param nonSelectCallback is called in case selecting is NOT happening
	 * we use callbacks because result of getSelection() when mouseUp is inconsistent in chrome. It is consistent if the check is shceduled*/
	function checkBrowserSelect(selectingCallback, nonSelectingCallback, event) {
		window.setTimeout(function() {
			if(isSelecting()) selectingCallback();	//TODO mouseUp when selecting is over => 0.3 sec selection time after
			else nonSelectingCallback();
		},0);
	}
	
	// ============================================= browser events =============================================
	
	function setBrowserEvents() {
		//event listeners executing even when TTS off TODO maybe not
		window.addEventListener("mouseup", saveMouseUpTime);
		window.addEventListener("mousedown", saveMouseDownTime);

		window.addEventListener("mousemove", function(event) {
			if(isAutomaticScrollingRecent()) return;
			checkBrowserSelect(onSelectingMouseMove, onNonSelectingMouseMove);
		});

		window.addEventListener("mouseup", function(event) {
			checkBrowserSelect(onSelectingMouseUp, onNonSelectingMouseUp);
		});

		window.addEventListener("keydown", function(event) {
			//TODO this executes even if turned off
			switch(event.keyCode) {
				case(32):
				case(37):
				case(38):
				case(39):
				case(40): if(isUserTyping()) return; break;	//space | left | up | right | down
			}
	
			switch(event.keyCode) {
				case(32): onSpace(event);			break;
				case(37): onArrow(event, "left");	break;
				case(38): onArrow(event, "up");		break;
				case(39): onArrow(event, "right");	break;
				case(40): onArrow(event, "down");	break;
				case(27): stopReadingOrRevertHighlight(event); break;
			}
		}, true);	//useCapture to have better chances that this listener executes first - so it can stop event propagation
	}
	
	// ============================================= init =============================================
	chrome.runtime.sendMessage({action: "getSettings"}, function(storedSettings) {
		settings.turnedOn = storedSettings.turnedOn;
		settings.hoverSelect = storedSettings.hoverSelect;
		settings.arrowSelect = storedSettings.arrowSelect;
		settings.browserSelect = storedSettings.browserSelect;
		digestSettings();
		setBrowserEvents();
	});
	chrome.runtime.sendMessage({action: "getLastTtsEvent"}, function(event) {
		lastTtsEventType = event ? event.type : null;
	});
})();

