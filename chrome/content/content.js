/* this is a content script - it is attached to each opened webpage*/
(function() {
	var settings = {};	//last cahnge of all settings
	
	var getTextToRead;	//either returns content of highlighted or browser-selected text
	var onArrow;	//called when arrows are pressed, parameters: keyEvent, direction
	var onClick;	//called when mouse is clicked
	var onSpace;	//called when space is pressed with parameter: keyEvent
	var onMouseMove;	//called when the mouse pinter moves
	
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
		element.style["-webkit-transition"] = "background-color .2s ease-in-out";
		switch(status) {
			case("highlighted"): 		element.style["background-color"] = "#4f4"; break;
			case("highlighted-loading"):element.style["background-color"] = "#55f"; break;
			case("highlighted-playing"):element.style["background-color"] = "#55f"; break;
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
	
	/** checks settings and reverts highlight in case its neede */
	function revertHighlightIfNeeded() {
		if(settings.highlightOnHover || settings.highlightOnArrows) return;
		revert("highlighted");
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
		clickedElement = status2element.highlighted;
		revert("loading");
		revert("playing");
		revert("error");

		if(status2element.highlighted) return status2element.highlighted.textContent;
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
	
	//cursor defines the path from which we can select elements when moving in one direction
	//direction is either horizontal or vertical
	//cursor is reset (both rect and direction) when direction changes
	var cursor = {rect:null, direction:null}
	
	var lastScroll = 0;	//time of last scrolling (automatic scrolling happens in case highlighted text is out of view)
	
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
	
	/** @return true if redable.rect is on the path selected by the cursor. assuming the cursor is set */
	function isOnPath(readable) {
		//filter based on cursor
		switch(cursor.direction) {
			case("vertical"):
				//equality: in case of tables, the top of underlying row is the same as bottom
				if(readable.rect.right <= cursor.rect.left) return false;
				if(cursor.rect.right <= readable.rect.left) return false;
				break;
			case("horizontal"):
				if(cursor.rect.bottom <= readable.rect.top) return false;
				if(readable.rect.bottom <= cursor.rect.top) return false;
				break;
		}
		return true;
	}
	
	/** @return distance between rect1 and rect2 in given direction
	 * elements are filtered based on the cursor */
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
	
	/** @return array of {element,rect} pairs under @param parent
	 * where each element contains text reictly and rect is the elements boundingClientRect*/
	function getReadableElementRectArr(parent) {
		if(!parent.getBoundingClientRect) return [];	//no getBoundingClientRect, no content
		
		var rect = parent.getBoundingClientRect();
		//checking the rect seems to be a smart, but in some cases (e.g. wikipedia left panel) readable elements are inside 0 size elements
		//if(rect.right-rect.left == 0 || rect.top-rect.bottom == 0) return [];	//no size, no content
		if(containsTextDirectly(parent)) return [{element:parent, rect:rect}];
		
		var result = []; //array of element,rect pairs
		for(var i=0; i<parent.childNodes.length; i++) {
			var child = parent.childNodes[i];
			result = result.concat(getReadableElementRectArr(child));
		}
		return result;
	}
	
	/** highlights element in @param direction from currently highlighted element */
	function stepHighlight(keyEvent, direction) {
		console.log("step to " + direction);
		keyEvent.preventDefault();	//stop scrolling

		var rect;
		if(status2element.highlighted) rect = status2element.highlighted.getBoundingClientRect();
		else rect = {top:0,bottom:0,left:0,right:0}
		
		var closest = {element:null,dist:-1,rect:null};
		setCursor(rect,direction);
		
		var readables = getReadableElementRectArr(document.documentElement).filter(isOnPath);
		readables.forEach(function(readable) {
			if(readable.element === status2element.highlighted) return;
			var d = dist(rect,readable.rect,direction);
			if(d <= 0) return;
			if((closest.dist > -1) && (closest.dist < d)) return;
			closest.element = readable.element;
			closest.dist = d;
			closest.rect = readable.rect;
		});
		
		if(!closest.element) {
			console.log("no closest found");
			return;
		}
		
		//scroll into view
		var doc = document.documentElement;
		switch(direction) {
			case("up"): if(closest.rect.top < 0) window.scrollBy(0,closest.rect.top); break;
			case("down"): if(closest.rect.bottom > window.innerHeight) window.scrollBy(0,closest.rect.bottom - window.innerHeight); break;
			case("left"): if(closest.rect.left < 0) window.scrollBy(closest.rect.left,0); break;
			case("right"): if(closest.rect.right > window.innerWidth) window.scrollBy(closest.rect.right - window.innerRight,0); break;
		}
		lastScroll = Date.now();	//TODO only if scrolled
		
		addStatus(closest.element,"highlighted");

		//createDivOnBoundingClientRect(closest.rect);
	}
	
	function isMouseMoveEventFromScrolling() {
		return (Date.now() - lastScroll) < 200;	//the usual value is around 100ms, TODO check on slower machines
	}
	
	//TODO remove this, only here for debugging
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
	
	/** reads the text to be read (highlighted paragraph / selected text) */
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
	function updateSetting(request) {
		settings[request.setting] = request.value;
		switch(request.setting) {
			case("selectType"):
				if(request.value == "highlightSelect") {
					getTextToRead = getHoveredParagraphText;
					onMouseMove = settings.highlightOnHover?highlightHoveredElement:null;
					onArrow = settings.highlightOnArrows?stepHighlight:null;
				} else {
					getTextToRead = getBrowserSelectedText;
					onMouseMove = null;
					onArrow = null;
					revert("highlighted");
				}
				break;
			case("highlightOnHover"):
				onMouseMove = request.value?highlightHoveredElement:null;
				revertHighlightIfNeeded();
				break;
			case("highlightOnArrows"):
				onArrow = request.value?stepHighlight:null;
				revertHighlightIfNeeded();
				break;
			case("readOnClick"): onClick = request.value?readText:null; break;
			case("readOnSpace"): onSpace = request.value?readTextAndPreventScroll:null; break;
		}
	}
	
	function onMessage(request, sender, sendResponse) {
		console.log("received: " + request.action);
		switch(request.action) {
			case("ClickAndSpeech.event"): animateClicked(request.event); break;
			case("ClickAndSpeech.set"): updateSetting(request); break;
		}
	}
	/** to react when setting is changed in options*/
	chrome.runtime.onMessage.addListener(onMessage);
	
	window.addEventListener("mousemove", function(event) {
		if(onMouseMove) onMouseMove();
	});
	window.addEventListener("mousedown", function(event) {
		if(onClick) onClick();
	});
	window.addEventListener("keydown", function(event) {
		//TODO turnOn
		switch(event.keyCode) {
			case(32): if(onSpace) onSpace(event);			break;
			case(37): if(onArrow) onArrow(event, "left");	break;
			case(38): if(onArrow) onArrow(event, "up");		break;
			case(39): if(onArrow) onArrow(event, "right");	break;
			case(40): if(onArrow) onArrow(event, "down");	break;
		}
	});
	
	//initial setup
	chrome.runtime.sendMessage({action: "ClickAndSpeech.getSettings"}, function(settings) {
		updateSetting({setting:"selectType", value:settings.selectType});
		updateSetting({setting:"highlightOnHover", value:settings.highlightOnHover});
		updateSetting({setting:"highlightOnArrows", value:settings.highlightOnArrows});
		updateSetting({setting:"readOnClick", value:settings.readOnClick});
		updateSetting({setting:"readOnSpace", value:settings.readOnSpace});
	});
})();