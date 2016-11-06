/* this is a content script - it is attached to each opened webpage*/
(function() {
	// ============================================= check if not already loaded =============================================

	//content scripts can be injected by the background page
	//this is a check to make sure the script is NOT loaded twice
	if(window.clickToSpeechContentScriptLoaded) {
		return;
	}
	console.log("injecting ClickToSpeech content script");
	window.clickToSpeechContentScriptLoaded = true;

	// ============================================= init =============================================
	//TODO think about this
	window.setTimeout(init);
	function init() {
		addClickToSpeechEventListeners();
		requestSettings();
	}

	function requestSettings() {
		backgroundCommunicationPort.postMessage({action:"getSettings"});	//the response will call backgroundEventListeners.updateSettings
	}

	// ============================================= turn on / off =============================================
	function turnOnOff(newSettings) {
		if(settings.turnedOn) turnOn();	//its OK if its called many times
		else turnOff();
	}

	function turnOn() {
		addBrowserEventListeners();
	}

	function turnOff() {
		removeBrowserEventListeners();
		setHighlighted(null);

		element2ttsEvent.clear();
		for(var id in speechRequests) {
			var request = speechRequests[id];
			if(request.element) {
				updateElementStyle(request.element);
				markText(null);
			}
			if(request.selection) recolorBrowserSelection(null);
		}
		speechRequests = {};
	}

	var settings = {};	//current settings

	// ============================================= ClickToSpeech background events =============================================
	function addClickToSpeechEventListeners() {
		backgroundCommunicationPort.onMessage.addListener(function(message) {
			var listener = backgroundEventListeners[message.action];
			if(listener) listener(message);
		});
	}

	var backgroundCommunicationPort = chrome.runtime.connect();

	var backgroundEventListeners = {};

	backgroundEventListeners.updateSettings = function(message) {
		for(var setting in message.settings) settings[setting] = message.settings[setting];
		turnOnOff();
	}

	backgroundEventListeners.updateSetting = function(message) {
		settings[message.setting] = message.value;
		turnOnOff();
	}

	backgroundEventListeners.ttsEvent = function(message) {
		lastTtsEventType = message.event ? message.event.type : null;
		console.log(message.event.speechId + " " + message.event.type);

		var eventListener = ttsEventListeners[lastTtsEventType];
		if(eventListener) eventListener(message.event);
	}
	var lastTtsEventType;
	var element2ttsEvent = new Map();

	// ============================================= tts events =============================================
	var ttsEventListeners = {};
	ttsEventListeners.end = function(event) {
		var request = speechRequests[event.speechId];
		delete speechRequests[event.speechId];

		if(request.selection) recolorBrowserSelection(null);
		if(request.element) {
			element2ttsEvent.delete(request.element);
			updateElementStyle(request.element);
			markText(null);
		}
	}
	ttsEventListeners.loading = function(event) {
		var request = speechRequests[event.speechId];
		if(request.selection) recolorBrowserSelection("loading");
		if(request.element) {
			element2ttsEvent.set(request.element,"loading");
			updateElementStyle(request.element);
			markText(null);
		}
	}
	ttsEventListeners.playing = function(event) {
		var request = speechRequests[event.speechId];
		if(request.selection) recolorBrowserSelection("reading");
		if(request.element) {
			element2ttsEvent.set(request.element,"playing");
			updateElementStyle(request.element);
			markText(event);
		}
	}
	ttsEventListeners.error = function(event) {
		var request = speechRequests[event.speechId];
		delete speechRequests[event.speechId];

		if(request.selection) {
			recolorBrowserSelection("error");
		}
		if(request.element) {
			element2ttsEvent.set(request.element,"error");
			updateElementStyle(request.element);
			markText(null);
			element2ttsEvent.delete(request.element);	//when user hovers over the element, the style will disappear
		}
	}

	// ============================================= ClickToSpeech content events =============================================

	function onArrow(keyEvent,direction) {
		if(settings.arrowSelect) stepHighlight(keyEvent,direction);
	}

	function onSpace(keyEvent) {
		if(highlightedElement) readHighlightedAndPreventScroll(keyEvent);
	}

	function onSelectingMouseMove() {
		setStyleOfFutureBrowserSelect(settings.browserSelect ? "selecting" : null);	//null: to remove style of markers
		if(highlightedElement) setHighlighted(null);
	}

	function onNonSelectingMouseMove() {
		if(settings.hoverSelect) highlightHoveredElement();
	}

	function onSelectingMouseUp() {
		if(settings.browserSelect) readBrowserSelected();
	}

	function onNonSelectingMouseUp() {
		if(settings.browserSelect) stopBrowserSelected();
		if(settings.hoverSelect) readHovered();
	}

	// ============================================= browser events =============================================

	function addBrowserEventListeners() {
		for(var event in browserEventListeners) {
			//last param: useCapture to have better chances that this listener executes first - so it can stop event propagation
			window.addEventListener(event, browserEventListeners[event], true);
		}
	}

	function removeBrowserEventListeners() {
		for(var event in browserEventListeners) {
			window.removeEventListener(event, browserEventListeners[event], true);
		}
	}

	//browserEvent:eventHandler map
	var browserEventListeners = {};
	browserEventListeners.mousedown = function(event) {
		if(event.button != 0) return;
		mouseDownTime = Date.now();
	}
	browserEventListeners.mouseup = function(event) {
		if(event.button != 0) return;
		mouseUpTime = Date.now();
		checkBrowserSelect(onSelectingMouseUp, onNonSelectingMouseUp);
	}
	browserEventListeners.mousemove = function() {
		if(isAutomaticScrollingRecent()) return;
		checkBrowserSelect(onSelectingMouseMove, onNonSelectingMouseMove);
	}
	browserEventListeners.keydown = function(event) {
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
	}

	/** @return true if the active element is an input area */
	function isUserTyping() {
		var activeElement = document.activeElement;
		return isInputElement(activeElement);
	}

	// ============================================= browserSelect decisions =============================================

	//to know whether mouse button is pressed TODO check which button
	var mouseDownTime = 0;
	var mouseUpTime = 0;

	/** @param selectingCallback is called in case selecting is happening
	 * @param nonSelectingCallback is called in case selecting is NOT happening
	 * we use callbacks because result of getSelection() is only consistent if the check is shceduled*/
	function checkBrowserSelect(selectingCallback, nonSelectingCallback) {
		window.setTimeout(function() {
			if(isBrowserSelecting()) selectingCallback();
			else nonSelectingCallback();
		},0);
	}

	/** selecting means: getSelection() returns something (thats not the marked text) + mouse button being pressed or mouseUp happened recently */
	function isBrowserSelecting() {
		if(!getSelection().toString()) return false;	//no text is selected => user is not selecting anything
		if(isSelectionTheMarkedRange()) return false;	//selection is just the marked text
		if(isMouseButtonBeingPressed()) return true;	//this is important when checking on mouseMove
		if(recentMouseUp()) return true;	//checking isSelecting on mouseUp + no hover right after selecting is over
		return false;
	}

	function isMouseButtonBeingPressed() {return mouseUpTime < mouseDownTime;}
	function recentMouseUp() {return Date.now() - 300 < mouseUpTime;}

	// ============================================= hovered =============================================

	/** highlights the element under mouse pointer */
	function highlightHoveredElement() {
		var element = getHoveredElement();
		setHighlighted(element);
	}

	/** @return the element to highlight when hovered paragraph is set */
	function getHoveredElement() {
		var hoveredNodes = document.querySelectorAll(":hover");

		//if user hovers on a clickable element (e.g. URL) we should return the clickable element (grey highlight)
		var clickable = getDeepestClickableElement(hoveredNodes);
		if(clickable) return containsNonText(clickable)?null:clickable;	//so we don't return with clickable images or huge clickable elements (e.g. youtube video)

		//if no clickable element is hovered, return the top readable
		return getTopReadableElement(hoveredNodes);
	}
	
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

	// ============================================= keyboard navigation =============================================
	/** highlights element in @param direction from currently highlighted element */
	function stepHighlight(keyEvent, direction) {
		keyEvent.stopPropagation();	//other event listeners won't execute
		keyEvent.preventDefault();	//stop scrolling

		var fromRect = getStepFromRect(direction);
		var closestReadable = getClosestReadableElement(fromRect, direction);

		if(!closestReadable) return;
		setHighlighted(closestReadable);
		scrollIntoView(closestReadable);

		backgroundCommunicationPort.postMessage({action: "arrowPressed"});
		
		//createDivOnBoundingClientRect(closestReadable);
	}

	/** @return the boundingClientRect of the currently higlighted|loading|playing|error element
	 * if no such element: return a rect representing the edge of the page:
	 * up: bottom edge | down: top edge | left: right edge | right: left edge*/
	function getStepFromRect(direction) {
		var activeElement = highlightedElement;
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

	/** @return the readableElement considered the closest to given fromRect in given direction
	 * @param fromRect the rect to which the closest is searched
	 * @param direction up|down|left|right the direction of search*/
	function getClosestReadableElement(fromRect, direction) {
		var result; //element,edgeOffset,onPath,relWidth,axisDist
		var pathWidth = getPathWidth(fromRect,direction);
		var viewRect = {top: 0,bottom: window.innerHeight,left:0,right: window.innerWidth};
		
		/** recursive function to update the result with given element (if needed) */
		function updateResult(element) {
			if(highlightedElement === element) return;	//already highlighted
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

	/** @return size of @param rect on the line perpendicular to @param direction */
	function getPathWidth(rect,direction) {
		switch(direction) {
			case("up"):
			case("down"): return rect.width;
			case("left"):
			case("right"): return rect.height;
		}
	}

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
	var lastScroll = 0;	//time of last scrolling caused by stepping (to prevent unnecessary onMouseMove event)
	
	/** when using the arrow keys and we step out of the view, there is an automatic scrolling, which fires a mousemove event
	 * @return true if the mouseMove event is beause of the automatic scrolling */
	function isAutomaticScrollingRecent() {
		return (Date.now() - lastScroll) < 500;	//the usual value is around 100ms
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

	// ============================================= highlight general =============================================

	/** sets highlightedElement to be the @param element */
	function setHighlighted(element) {
		if(highlightedElement === element) return;

		var oldHighlighted = highlightedElement;
		highlightedElement = element;

		updateElementStyle(oldHighlighted);
		updateElementStyle(highlightedElement);
	}
	var highlightedElement;
	
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
	function containsNonText(element) {
		if(!element.childNodes.length) return true;
		
		if(window.location.hostname == "www.facebook.com") {
			if(element.classList.contains("jewelButton")) return true;	//fb friend requests, messages, notifications
		}

		for(var i=0; i<element.childNodes.length; i++) {
			var child = element.childNodes[i];
			switch(child.nodeType) {
				case(Node.TEXT_NODE): continue; break;
				case(Node.ELEMENT_NODE): if(containsNonText(child)) return true; break;
				default: return true;
			}
		}
		return false;
	}


	// ============================================= element style =============================================

	/** updates the style of @param element
	 * or reverts if it has no status */
	function updateElementStyle(element) {
		if(!element) return;
		saveOriginal(element);
		
		var status = getElementStatus(element);
		if(!status) {
			revertStyle(element);
			return;
		}
		
		element.style["-webkit-transition"] = "background .2s, background-color .2s, color .2s";	//'background' transition doesn't seem to work
		element.style["background"] = "none";
		element.style["color"] = "black";
		
		var backgroundColor;
		switch(status) {
			case("highlighted-nonclickable"):
				backgroundColor = "#4f4"; break;
			case("highlighted-clickable"):
				backgroundColor = "#ccc"; break;
			case("loading"):
			case("playing"):
				backgroundColor = "#bbf"; break;
			case("highlighted-nonclickable-loading"):
			case("highlighted-nonclickable-playing"):
			case("highlighted-clickable-loading"):
			case("highlighted-clickable-playing"):
				backgroundColor = "#88f"; break;
			case("error"):
				backgroundColor = "#fbb"; break;
			case("highlighted-nonclickable-error"):
			case("highlighted-clickable-error"):
				backgroundColor = "#f88"; break;
			default:
				backgroundColor = element2original.get(element).backgroundColor; break;	//TODO is this needed?
		}
		element.style["background-color"] = backgroundColor;
	}

	/** @return the status of @param element
	 * status can be:
	 * 1) highlighted-(clickable|nonclickable)
	 * 2) (loading|reading|error)
	 * 3) highlighted-(clickable|nonclickable)-(loading|reading|error)*/
	function getElementStatus(element) {
		var result = [];
		if(element === highlightedElement) {
			result.push("highlighted");
			result.push(isClickable(element)?"clickable":"nonclickable");
		}
		
		var ttsEvent = element2ttsEvent.get(element);
		if(ttsEvent) result.push(ttsEvent);
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
			if(getElementStatus(element)) return;
			
			//otherwise we do, and also remove the original for given element
			element.style["-webkit-transition"] = original.transition;
			element2original.delete(element);
		}, 200);
	}

	/** saves the current style of @param element */
	function saveOriginal(element) {
		if(element2original.get(element)) return;	//already saved
		element2original.set(element,{
			background:element.style["background"]	//this overrides background-color in soem cases => set to none (e.g. google search result top-right login button)
			,backgroundColor:element.style["background-color"]
			,color: element.style["color"]
			,transition:element.style["-webkit-transition"]
		});
	}
	var element2original = new Map();	//element => {background, backgroundColor, color, transition}

	// ============================================= browserSelect style =============================================

	/** changes the color of the selections in future
	 * @param state loading|reading|error defines the color to use */
	function setStyleOfFutureBrowserSelect(state) {
		var cssToSet = browserSelectCss[state] || "";
		if(cssToSet) getStyleElement().innerHTML = cssToSet;
		else removeStyleElement();
	}

	/** changes the color of the current selection 
	 * @param state loading|reading|error defines the color to use */
	function recolorBrowserSelection(state) {
		var cssToSet = browserSelectCss[state];
		if(cssToSet == getCurrentCss()) return;

		setStyleOfFutureBrowserSelect(state);
		reselectBrowserSelection();
	}

	/** selects the current selection in the next cycle */
	function reselectBrowserSelection() {
		var selection = window.getSelection();
		if(selection.rangeCount < 1) return;	//when clicking on empty area while loading

		var range = selection.getRangeAt(0);
		selection.removeAllRanges();
		window.setTimeout(function() {
			if(selection.toString() === "") selection.addRange(range);	//make sure that no selection happened in this 50 millisec
		}, 50);	//css changes take effect later
	}

	function getStyleElement() {
		if(!styleElement) appendStyleElement();
		return styleElement;
	}

	function getCurrentCss() {
		if(!styleElement) return null;
		return styleElement.innerHTML;
	}

	function appendStyleElement() {
		styleElement = document.createElement("style");
		styleElement.setAttribute("id","ClickToSpeechBrowserSelectionStyle");
		styleElement.type = 'text/css';

		var head = document.getElementsByTagName("head")[0];
		head.appendChild(styleElement);
	}

	function removeStyleElement() {
		if(styleElement) styleElement.parentNode.removeChild(styleElement);
		styleElement = null;
	}

	var styleElement;

	var browserSelectCss = {};
	browserSelectCss.selecting = "*::selection {background-color:#4f4 !important; color:black !important;}";
	browserSelectCss.loading = "*::selection {background-color:#88f !important; color:black !important;}";
	browserSelectCss.reading = "*::selection {background-color:#88f !important; color:black !important;}";
	browserSelectCss.error = "*::selection {background-color:#fbb !important; color:black !important;}";
	browserSelectCss.marker = "*::selection {background-color:#88f !important; color:black !important;}";

	// ============================================= speechRequests NEEEEEEEW =============================================
	// id: {element,textNodes | selection}
	var speechRequests = {};

	/** sends read message with content of element or selection
	 * @param c.element | c.selection added to speechRequests
	 * @param c.source is used for analytics */
	function requestSpeech(c) {
		var text = textFromRequest(c);

		++speechCounter;
		backgroundCommunicationPort.postMessage({action:"read", speechId:speechCounter, text:removeSpecialCharacters(text), lan:document.documentElement.lang, source:c.source});
		speechRequests[speechCounter] = c.selection ? {selection:c.selection} : {element:c.element, textNodes:getTextNodes(c.element)}
	}
	var speechCounter = 0;

	function textFromRequest(c) {
		if(c.selection) return getSelection().toString();
		if(c.element) return c.element.textContent;
		return "";
	}

	/** TODO this should go the background-page */
	function removeSpecialCharacters(text) {
		//Google Docs support (200B character)
		//replace curly quotes to normal ones
		return text.replace(/[\u200B]/g, " ").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
	}

	// ============================================= read =============================================
	
	/** reads text of hovered element */
	function readHovered() {
		markText(null);	//TODO needed?
		highlightHoveredElement();
		if(isClickable(highlightedElement)) {
			requestSpeech({element:null, source:"hoveredClickableClick"});
			return;
		}
		requestSpeech({element:highlightedElement, source:"hoveredClick"});
	}

	/** reads highlighted text + prevents scrolling */
	function readHighlightedAndPreventScroll(event) {
		requestSpeech({element:highlightedElement, source:"space"});
		event.preventDefault();	//stop scrolling
	}

	/** reads the text provided by browserSelect */
	function readBrowserSelected() {
		requestSpeech({selection:true, source:"browserSelect"});
	}

	/** stops reading + sets source as "browserSelected" */
	function stopBrowserSelected() {
		requestSpeech({source:"browserSelect"});
	}

	/** if reading: stops reading and cancels event; otherwise reverts highlight (if any) and cancels event
	 * if no reading, neither highlight => nothing*/
	function stopReadingOrRevertHighlight(keyEvent) {
		if(["loading","playing","error"].indexOf(lastTtsEventType) > -1) {
			requestSpeech({source:"esc"});
			keyEvent.stopPropagation();
			return;
		}
		if(highlightedElement) {
			setHighlighted(null);
			keyEvent.stopPropagation();
		}
	}

	// ============================================= marker event =============================================
	/** selects text between @param c.startOffset and @param c.endOffset indecies if matches @param c.text */
	function markText(c) {

		//otherwise when mouse button is pressed, the selection gets connected to the marked text
		if(isMouseButtonBeingPressed()) {
			markedRange = null;
			return;	//browserSelect style not set - I assume it was set by onSelectingMouseMouve|Up
		}

		//check if no selection happened since
		if(!isSelectionTheMarkedRange()) {
			markedRange = null;
			return;	//browserSelect style not set - I assume it was set by onSelectingMouseMouve|Up TODO what if JS selects text?
		}

		if(isUserTyping()) {
			markedRange = null;
			setStyleOfFutureBrowserSelect(null);
			return;
		}

		removeSelection();

		if(isEmptyMarker(c)) {
			markedRange = null;
			setStyleOfFutureBrowserSelect(null);
			return;
		}

		var range = getRangeForMarker(c);
		if(range.toString() != c.text) {
			markedRange = null;
			setStyleOfFutureBrowserSelect(null);
			return;
		}

		setStyleOfFutureBrowserSelect("marker");
		selectRange(range);	//check if the textNodes didnt change since read request TODO test
	}
	var markedRange = null;

	function isSelectionTheMarkedRange() {
		if(isSelectionEmpty()) return markedRange == null;
		if(isSelectionMoreRanges()) return false;	//marker is always 1 range
		return compareRanges(getFirstSelectionRange(), markedRange);
	}

	function removeSelection() {
		var selection = window.getSelection();
		selection.removeAllRanges();
	}

	function isSelectionEmpty() {
		var selection = window.getSelection();
		if(selection.rangeCount == 0) return true;

		var range = selection.getRangeAt(0);
		return isRangeEmpty(range);
	}

	function isSelectionMoreRanges() {
		return window.getSelection().rangeCount > 1;
	}

	function isRangeEmpty(range) {
		return (range.startContainer == range.endContainer && range.startOffset == range.endOffset);
	}

	function getFirstSelectionRange() {
		var selection = window.getSelection();
		var rangeCount = selection.rangeCount;
		return rangeCount < 1 ? null : selection.getRangeAt(0);
	}

	/** @return true if @param range1 matches @param range2. Simple == doesnt work */
	function compareRanges(range1,range2) {
		if(range1 == null && range2 == null) return true;
		if(range1 == null || range2 == null) return false;
		if(range1.startContainer != range2.startContainer) return false;
		if(range1.startOffset != range2.startOffset) return false;
		if(range1.endContainer != range2.endContainer) return false;
		if(range1.endOffset != range2.endOffset) return false;
		return true;
	}

	/** @return range between @param c.startOffset and @param c.endOffset */
	function getRangeForMarker(c) {
		var textNodes = speechRequests[c.speechId].textNodes;

		var start = getNodeAndOffsetOfAbsoluteOffset(textNodes, c.startOffset);
		var end = getNodeAndOffsetOfAbsoluteOffset(textNodes, c.endOffset);

		var range = document.createRange();
		range.setStart(start.node,start.offset);
		range.setEnd(end.node,end.offset);

		return range;
	}

	/** @return {node,offset} object where node is the node in which character on @param offset index is found, and offset is the relative offset isndei the node*/
	function getNodeAndOffsetOfAbsoluteOffset(textNodes, offset) {
		var iteratedCharCount = 0;
		for(var i=0; i<textNodes.length; i++) {
			var node = textNodes[i];
			var nodeTextLength = node.textContent.length;
			if(iteratedCharCount + nodeTextLength > offset) return {node:node,offset:offset-iteratedCharCount};
			iteratedCharCount += nodeTextLength;
		}

		//the length of the text increased since reading started - no perfect solution, just mark till the end
		var node = textNodes[textNodes.length-1];
		return {node:node,offset:node.textContent.length}
	}

	function isEmptyMarker(marker) {
		return (!marker || marker.startOffset == marker.endOffset);
	}

	function selectRange(range) {
		var selection = window.getSelection();
		selection.addRange(range);
		markedRange = range;
	}

	/** @return an array of textNodes in @param node */
	function getTextNodes(node) {
		if(!node) return [];

		if(node.nodeType == Node.TEXT_NODE) {
			return [node];
		}

		var result = [];
		for(var i=0; i<node.childNodes.length; i++) {
			result = result.concat(getTextNodes(node.childNodes[i]));
		}
		return result;
	}

	// ============================================= destroy =============================================
	
	function destroy() {
		console.log("removing ClickToSpeech content script");
		window.clickToSpeechContentScriptLoaded = false;
		turnOff();
		removeBrowserEventListeners();
	}

	backgroundCommunicationPort.onDisconnect.addListener(function() {
		destroy();
	});
})();
