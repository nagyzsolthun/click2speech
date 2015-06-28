/* this is a content script - it is attached to each opened webpage*/
(function() {
	var settings = {};	//last cahnge of all settings
	var readingStatus = null;
	
	var getTextToRead;	//either returns content of highlighted or browser-selected text
	var onArrow;	//called when arrows are pressed, parameters: keyEvent, direction
	var onClick;	//called when mouse button is clicked
	var onMouseDown;	//called when mouse button is down - used fot built-in select, so reading wont start only when 2nd click
	var onSpace;	//called when space is pressed with parameter: keyEvent
	var onMouseMove;	//called when the mouse pinter moves
	var onEsc;	//called when esc key is pressed
	
	// ============================================= highlight =============================================	
	var clickedElement = null;	//TODO maybe some nicer logic
	
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
				break;
			case("highlighted-loading"):
				element.style["background-color"] = "#55f";
				element.style["color"] = "black";
				break;
			case("highlighted-playing"):
				element.style["background-color"] = "#55f";
				element.style["color"] = "black";
				break;
			case("highlighted-error"):
				element.style["background-color"] = "#f55";
				element.style["color"] = "black";
				break;
			case("loading"): 
				element.style["background-color"] = "#bbf";
				element.style["color"] = "black";
				break;
			case("playing"):
				element.style["background-color"] = "#bbf";
				element.style["color"] = "black";
				break;
			case("error"):
				element.style["background-color"] = "#fbb";
				element.style["color"] = "black";
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
		window.setTimeout(function() {
			//if any style is set, we don't revert the the transition
			if(concatenatedStatus(element)) return;
			
			//otherwise we do, and also remove the original for given element
			element.style["-webkit-transition"] = original.transition;
			element2original.delete(element);
		}, 200);
	}
	
	function containsTextDirectly(element) {
		for(var i=0; i<element.childNodes.length; i++) {
			var child = element.childNodes[i];
			if(child.nodeType == Node.TEXT_NODE && /\S/.test(child.nodeValue)) return true;	//text node AND not empty
		}
		return false;
	}
	
	/** @return the text in highlighted element */
	function getHoveredParagraphText() {
		clickedElement = status2element.highlighted;	//TODO this should not come here
		if(clickedElement) return clickedElement.textContent;
		else return "";
	}
	
	// ============================================= highlighted element =============================================
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
		if(isMouseMoveEventFromScrolling()) return true;	//TODO, here?
		var element = getHoveredParagraph();
		addStatus(element, "highlighted");
		setCursor();	//revert cursor
	}
	
	// ============================================= keyboard navigation =============================================
	
	/** when stepping between elements, the cursor defines the path we can take. It has a rect and a direction (horizontal|vertical)
	 * when moving up/down, all elements we step on are between the left and right side of cursor.rect (vertical path)
	 * when moving left/right, the current element will be the cursor, and the path will be between rect.top and rect.bottom (horizontal path)
	 * 
	 * this strategy showed the best results when comparying different concepts*/
	var cursor = {rect:null, direction:null}

	/** sets the cursor
	 * @param rect the rect of the currently highlighted element
	 * @param direction up|down|left|right
	 * if the direction of the cursor (horizontal|vertical) is different than the one defined by @param direction, cursor is reset*/
	function setCursor(rect, direction) {
		switch(direction) {
			case("up"):
			case("down"):
				if(cursor.direction != "vertical") {
					cursor.direction = "vertical";
					cursor.rect = rect;
				}
				break;
			case("left"):
			case("right"):
				if(cursor.direction != "horizontal") {
					cursor.direction = "horizontal";
					cursor.rect = rect;
				}
				break;
			default:	//to remove the cursor
				cursor.direction = null;
				cursor.rect = null;
		}
	}
	
	/** @return true if rect is on the path selected by the cursor. assuming the cursor is set*/
	function isOnPath(rect) {
		//filter based on cursor
		switch(cursor.direction) {
			case("vertical"):
				//equality: in case of tables, the top of underlying row is the same as bottom
				if(rect.right <= cursor.rect.left) return false;
				if(cursor.rect.right <= rect.left) return false;
				break;
			case("horizontal"):
				if(cursor.rect.bottom <= rect.top) return false;
				if(rect.bottom <= cursor.rect.top) return false;
				break;
		}
		return true;
	}
	
	/** @return distance between rect1 and rect2 in given direction
	 * result my be negative in case rect2 is "behind" rect1 based on direction */
	function dist(rect1,rect2,direction) {
		var m1 = {x:(rect1.left + rect1.right)/2, y:(rect1.top + rect1.bottom)/2};
		var m2 = {x:(rect2.left + rect2.right)/2, y:(rect2.top + rect2.bottom)/2};
		
		//get the distance in given direction
		switch(direction) {
			case("up"): return m1.y - m2.y;
			case("down"): return m2.y - m1.y;
			case("left"): return m1.x - m2.x;
			case("right"): return m2.x - m1.x;
		}
	}
	
	var closest = {element:null,dist:-1,rect:null};
	
	/** sets closest
	 * @param fromRect the rect to which the closest is searched
	 * @param element the element we currently check
	 * @param direction up|down|left|right the direction of search
	 * @parant */
	function setClosest(fromRect, element, direction) {
		if(!element) return;
		if(!element.getBoundingClientRect) return; //no getBoundingClientRect: no content
		
		//contains text directly => check if position is fine
		if(containsTextDirectly(element)) {
			var rect = element.getBoundingClientRect();
			if(!isOnPath(rect)) return;
			if(element === status2element.highlighted) return;
			var d = dist(fromRect,rect,direction);
			if(d <= 0) return;
			if((closest.dist > -1) && (closest.dist < d)) return;
			closest.element = element;
			closest.dist = d;
			closest.rect = rect;
			return;
		}
		
		//doesn't contain text directly => explore its children
		for(var i=0; i<element.childNodes.length; i++) {
			var child = element.childNodes[i];
			setClosest(fromRect, child, direction);
		}
	}
	
	/** @return the boundingClientRect of the currently higlighted element
	 * otherwise return a rect representing the edge of the page:
	 * up: bottom edge | down: top edge | left: right edge | right: left edge*/
	function getFromRect(direction) {
		if(status2element.highlighted) return status2element.highlighted.getBoundingClientRect();

		//dimensions of the page relative to view
		result = {top: -window.pageYOffset, bottom: document.body.scrollHeight-window.pageYOffset, left:-window.pageXOffset, right: document.body.scrollWidth-window.pageXOffset};
		switch(direction) {
			case("up"): result.top = result.bottom; break;
			case("down"): result.bottom = result.top; break;
			case("left"): result.left = result.right; break;
			case("right"): result.right = result.left; break;
			default: result = document.documentElement.getBoundingClientRect();	//wont reach
		}
		return result;
	}
	
	var lastScroll = 0;	//time of last scrolling caused by stepping (to prevent unnecessary onMouseMove event)
	
	/** highlights element in @param direction from currently highlighted element */
	function stepHighlight(keyEvent, direction) {
		keyEvent.stopPropagation();	//other event listeners won't execute
		keyEvent.preventDefault();	//stop scrolling

		var fromRect = getFromRect(direction);
		setCursor(fromRect,direction);
		
		closest = {element:null,dist:-1,rect:null};
		setClosest(fromRect, document.documentElement, direction);

		if(!closest.element) return;
		addStatus(closest.element,"highlighted");
		chrome.runtime.sendMessage({action: "stepHighlight"}, null);
		
		//scroll into view
		var scroll = {x:0,y:0};
		if(closest.rect.top < 0) scroll.y += closest.rect.top;
		if(closest.rect.bottom > window.innerHeight) scroll.y += closest.rect.bottom-window.innerHeight;
		if(closest.rect.left < 0) scroll.x += closest.rect.left;
		if(closest.rect.right > window.innerWidth) scroll.x += closest.rect.right-window.innerWidth;
		if(scroll.x || scroll.y) {
			window.scrollBy(scroll.x, scroll.y);
			lastScroll = Date.now();
		}
		//createDivOnBoundingClientRect(closest.rect);
	}
	
	function isMouseMoveEventFromScrolling() {
		return (Date.now() - lastScroll) < 500;	//the usual value is around 100ms
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
	
	// ============================================= animate clicked =============================================
	
	function animateClicked(readingEvent) {
		switch(readingEvent) {
			case("loading"):
				readingStatus = "loading";
				addStatus(clickedElement,"loading");
				break;
			case("start"):
				readingStatus = "playing";
				addStatus(clickedElement,"playing");
				break;
			case("end"):
				readingStatus = null;
				addStatus(null,"playing");	//reverts loading, playing, error
				break;
			case("error"):
				readingStatus = "error";
				addStatus(clickedElement,"error");
				break;
		}
	}

	// ============================================= browser select =============================================
	/** reads the selected area*/
	function getBrowserSelectedText() {
		return getSelection().toString();
	}
	
	// ============================================= read =============================================
	
	/** reads the text to be read (highlighted paragraph / selected text) */
	function readText() {
		chrome.runtime.sendMessage({
			action: "read"
			,text: getTextToRead()	//should never reach this point if getTextToRead is null
			,lan: document.documentElement.lang
		});
	}
	
	/** should be called with the click event
	 * reads text provided by getText() and stops delegating the click event if the highlighted element is NOT being read */
	function readTextAndPreventClickDelegation(event) {
		//highlightSelect - in case the click element is NOT being read, we read it + stop click propagation
		var activeElements = [status2element.loading,status2element.playing,status2element.error];
		if(activeElements.indexOf(status2element.highlighted) < 0 || status2element.highlighted == null) {
			readText();
			event.stopPropagation();
			event.preventDefault();
		}
	}
	
	/** should be called with the "keydown" event when space is pressed
	 * reads text provided by getText(), and stops page scroll if the active element is an input*/
	function readTextAndPreventScroll(event) {
		readText();
		event.preventDefault();	//stop scrolling
	}
	
	// ============================================= general =============================================
	
	//sets behavior of the content script based on the settings cache
	function digestSettings() {
		//turned off
		if(! settings.turnedOn) {	
			onClick = null;
			onMouseDown = null;
			onSpace = null;
			onMouseMove = null;
			onArrow = null;
			revert("highlighted");
			return;
		}
		
		//selectType: highlightSelect
		if(settings.selectType == "highlightSelect") {
			getTextToRead = getHoveredParagraphText;
			onMouseMove = settings.highlightOnHover?highlightHoveredElement:null;
			onArrow = settings.highlightOnArrows?stepHighlight:null;
		}
		
		//selectType: builtInSelect
		if(settings.selectType == "builtInSelect") {
			getTextToRead = getBrowserSelectedText;
			onMouseMove = null;
			onArrow = null;
			revert("highlighted");
			clickedElement = null;	//otherwise loading + reading event would color it
		}
		
		//highlightOnHover
		if(settings.highlightOnHover && settings.selectType == "highlightSelect") onMouseMove = highlightHoveredElement;
		else onMouseMove = null;
		
		//highlightOnArrows
		if(settings.highlightOnArrows && settings.selectType == "highlightSelect") onArrow = stepHighlight;
		else onArrow = null;
		
		//revert highlight if no setting matches
		if(!settings.highlightOnArrows && !settings.highlightOnHover) revert("highlighted");
		
		//readOnClick - builtInSelect
		if(settings.readOnClick && settings.selectType == "builtInSelect") onMouseDown = readText;
		else onMouseDown = null;
 
		//readOnClick - highlightSelect
		if(settings.readOnClick && settings.selectType == "highlightSelect") onClick = readTextAndPreventClickDelegation;
		else onClick = null;
		
		//readOnSpace
		if(settings.readOnSpace) onSpace = readTextAndPreventScroll;
		else onSpace = null;
	}
	
	function onMessage(request, sender, sendResponse) {
		switch(request.action) {
			case("event"): animateClicked(request.event); break;
			case("set"):
				settings[request.setting] = request.value;
				digestSettings();
				break;
		}
	}
	/** to react when setting is changed in options*/
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
	
	stopReading = function(keyEvent) {
		chrome.runtime.sendMessage({action: "read",text:""});
		keyEvent.stopPropagation();	//other event listeners won't execute
	}
	
	window.addEventListener("mousemove", function(event) {
		if(onMouseMove) onMouseMove(event);
	});
	window.addEventListener("click", function(event) {
		if(onClick) onClick(event);
	}, true);	//useCapture to have better chances that this listener executes first - so it can stop event propagation
	window.addEventListener("mousedown", function(event) {
		if(onMouseDown) onMouseDown(event);
	}, true);	//useCapture to have better chances that this listener executes first - so it can stop event propagation

	window.addEventListener("keydown", function(event) {
		//TODO this executes even if turned off
		switch(event.keyCode) {
			case(32):
			case(37):
			case(38):
			case(39):
			case(40): if(isUserTyping()) return; break;	//space | left | up | right | down
			case(27): if(readingStatus != "playing" && readingStatus != "loading") return;	//esc
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
		settings.highlightOnHover = storedSettings.highlightOnHover;
		settings.highlightOnArrows = storedSettings.highlightOnArrows;
		settings.readOnClick = storedSettings.readOnClick;
		settings.readOnSpace = storedSettings.readOnSpace;
		settings.noDelegateFirstClick = storedSettings.noDelegateFirstClick;

		digestSettings();
	});
})();
