/** a factory that creates list of selectable elements (for the options page */
define(function() {
	
	/** removes "selected" from all options */
	function unselectAll(options) {
		options.forEach(function(option) {
			option.classList.remove("selected");
		});
	}
	
	/** adds "selected" to given option*/
	function select(option) {
		option.classList.add("selected");
	}
	
	/** @return an element containing list of options
	 * @param c.options list of options to be added.
	 * 	an option should have a @param text to be shown and a @param value
	 * 	if @param selected is true, the given option will be selected (without executing the callback!)
	 * @param c.clickCallback is executed when an option is clicked - this method can decide how many options can be selected*/
	function createOptionsList(c) {
		var result = document.createElement("ul");
		
		var optionElements = [];
		c.options.forEach(function(option) {
			//we put the text in a span - to be able to highlight only the text but hover the whole line TODO rethink this
			var optionSpan = document.createElement("span");
			optionSpan.innerHTML = option.text;
			
			var optionElement = document.createElement("li");
			optionElement.appendChild(optionSpan);
			optionElement.dataset.value = option.value;

			result.appendChild(optionElement);
			optionElements.push(optionElement);
			
			if(option.selected) select(optionElement);
		});
		
		optionElements.forEach(function(optionElement) {
			optionElement.onclick = function() {
				c.clickCallback(optionElements, optionElement);
			}
		});
		
		return result;
	}

	// ================================== public ==================================
	var factory = {};
	
	/** @return an element that holds list of options - only 1 at a time can be selected
	 * @param c.options list of options to be added.
	 * 	an option should have a @param text to be shown and a @param value
	 * 	if @param selected is true, the given option will be selected (without executing the callback!) 
	 * @param onselect executed when an option is selected. its @param value is the value of selected option
	*/
	factory.createSingleChoiceList = function(c) {
		var result = createOptionsList({
			options:c.options
			,clickCallback: function(optionElements, optionElement) {
				unselectAll(optionElements);
				select(optionElement);
				if(c.onselect) c.onselect(optionElement.dataset.value);
			}
		});

		result.className = "choiceList singleChoiceList";
		return result;
	}
	
	/** @return an element that holds list of options - any number of options can be selected
	 * @param c.options list of options to be added.
	 * 	an option should have a @param text to be shown and a @param value
	 * 	if @param selected is true, the given option will be selected (without executing the callback!) 
	 * @param onselect executed when an option is selected with the following parameters:
	 * 	@param value the value of the option selected
	 * 	@param selected true if the option has the "selected" class after the user selected it, false otherwise
	*/
	factory.createMultipleChoiceList = function(c) {
		var result = createOptionsList({
			options: c.options
			,clickCallback: function(optionElements, optionElement) {
				optionElement.classList.toggle("selected");
				if(c.onselect) c.onselect(optionElement.dataset.value, optionElement.classList.contains("selected"));
			}
		});

		result.className = "choiceList multipleChoiceList";
		return result;
	}
	
	/** @return an element that holds a range and a number input
	 * @param c.min minimum value
	 * @param c.max maximum value
	 * @param c.step the step
	 * @param c.value the default value
	 * @param c.onchange function to execute when value changes
	 */
	factory.createNumberedRange = function(c) {
		var result = document.createElement("div");
		result.className = "numberedRange";
		
		var numberInput = document.createElement("input");
		numberInput.className = "numberInput";
		numberInput.type = "number";
		numberInput.min = c.min;
		numberInput.max = c.max;
		numberInput.step = c.step;
		numberInput.value = c.value;
		
		var rangeInput = document.createElement("input");
		rangeInput.className = "rangeInput";
		rangeInput.type = "range";
		rangeInput.min = c.min;
		rangeInput.max = c.max;
		rangeInput.step = c.step;
		rangeInput.value = c.value;
		
		numberInput.onchange = function() {
			if(c.onchange) c.onchange(this.value);
			rangeInput.value = this.value;
		}
		rangeInput.oninput = function() {
			if(c.onchange) c.onchange(this.value);
			numberInput.value = this.value;
		}
		
		result.appendChild(numberInput);
		result.appendChild(rangeInput);
		return result;
	}

	return factory;
});