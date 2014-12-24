require.config({
	baseUrl: "/../js/modules"
});

require(["optionsElementFactory"], function(elementFactory) {

	/** notifies background about a changed setting*/
	function sendSet(setting, value) {
		chrome.runtime.sendMessage({
			action:"webReader.set"
			,setting: setting
			,value: value
		});
	}
	
	/** @return an element with "control hoverable" classes + an optional titleElement with given title content */
	function createControlElement(title) {
		var result = document.createElement("div");
		result.className = "control hoverable";
		
		if(title) {
			var titleElement = document.createElement("div");
			titleElement.innerHTML = title;
			result.appendChild(titleElement);
		}
		
		return result;
	}
	
	chrome.runtime.sendMessage({action: "webReader.getSettings"}, function(settings) {
		// ======================================== select Settings ========================================
		var selectEventList = elementFactory.createSingleChoiceList({
			options: [
				{text:"pointed paragraph",value:"pointedParagraph", selected:settings.selectEvent=="pointedParagraph"}
				,{text:"browser provided selection",value:"browserSelect", selected:settings.selectEvent=="browserSelect"}
			]
			,onselect: function(value) {sendSet("selectEvent", value);}
		});
		
		var selectControl = createControlElement("Selection");
		selectControl.appendChild(selectEventList);

		document.getElementById("content").appendChild(selectControl);
		
		// ======================================== read event ========================================
		//TODO: implement these
		var readEventList = elementFactory.createMultipleChoiceList({
			options: [
				{text:"click",value:"readOnClick", selected:settings.clickReadEvent==true}
				,{text:"keyboard",value:"readOnKeyboard", selected:settings.keyboardReadEvent!=null}
			]
			,onselect: function(value, isSelected) {
				switch(value) {
					case("readOnClick"): sendSet("clickReadEvent",isSelected); break;
					case("readOnKeyboard"): sendSet("keyboardReadEvent","key"); break;
				}
			}
		});
		
		var readEventControl = createControlElement("Read Event");
		readEventControl.appendChild(readEventList);

		document.getElementById("content").appendChild(readEventControl);
		
		// ======================================== speed Settings ========================================
		var speedRange = elementFactory.createNumberedRange({
			min: .5, max: 4, step: .1, value: settings.speed, onchange: function(value) {
				sendSet("speed", value);
			}
		});
		var speedControl = createControlElement("Speed of Speech");
		speedControl.appendChild(speedRange);

		document.getElementById("content").appendChild(speedControl);
		
	});
});