/** provides functions to split a text in a way that it ends at end of sentence, at comma, or end of word */
define(function() {
	var splitter = {};

	/** @return array of strings, that match requreiments specified in @param c.testLength
	 * @param c.text
	 * @param c.testLength callback(startIndex,endIndex), returns true if text between given indecies matches tts requirements, returns false otherwise */
	splitter.split = function(c) {
		var result = [];
		var splitIndecies = getSplitIndecies(c);
		for(var i=0; i<splitIndecies.length-1; i++) {
			result.push(c.text.substring(splitIndecies[i], splitIndecies[i+1]));
		}
		return result;
	}

	/** @return array of indecies marking begenning+end of substrings passing test, devided at reasonable points (sentence-end, comma, space)
	 * @note contains 0 and end of text position, too */
	function getSplitIndecies(c) {
		var result = [];
		var delimiterEndIndecies = getDelimiterEndIndecies(c.text);

		var currentSplitIndex = 0;
		result.push(currentSplitIndex);

		while(currentSplitIndex != c.text.length) {
			currentSplitIndex = getNextSplitIndex({delimiterEndIndecies:delimiterEndIndecies, currentSplitIndex:currentSplitIndex, testLength:c.testLength});
			result.push(currentSplitIndex);
		}
		return result;
	}

	/** @return the next split index
	 * @param c.delimiterEndIndecies
	 * @param c.currentSplitIndex
	 * @param c.testLength
	 * @note returns end of string too */
	function getNextSplitIndex(c) {
		for(var i=0; i<DELIMITERS.length; i++) {
			var delimiter = DELIMITERS[i];
			var endIndecies = c.delimiterEndIndecies[delimiter];
			var highestPassingIndex = getHighestPassingIndex({endIndecies:endIndecies,currentSplitIndex:c.currentSplitIndex,testLength:c.testLength});
			if(highestPassingIndex > -1) return highestPassingIndex;
		}

		//no passing result when split by regex - lets check character-by-character increased index
		var index = currentSplitIndex+1;
		while(c.testLength(currentSplitIndex,index)) {
			index++;
		}
		return index;
	}

	/** @return the highest delimiter-end index higher than @param c.currentSplitIndex, that passes @param c.testLength, or -1 if none found
	 * @param c.endIndecies */
	function getHighestPassingIndex(c) {
		var result = -1;
		for(var i=0; i<c.endIndecies.length; i++) {
			var endIndex = c.endIndecies[i];
			if(endIndex <= c.currentSplitIndex) continue;
			if(c.testLength(c.currentSplitIndex,endIndex)) result = endIndex;
			else break;
		}
		return result;
	}

	const DELIMITERS = [ /\.\s+/g, /\?\s+/g, /\!\s+/g, /\;\s+/g, /\,\s+/g, /\s+/g];

	/** @return map of delimiter->matchEndArr */
	function getDelimiterEndIndecies(text) {
		var result = {};
		DELIMITERS.forEach(function(delimiter) {
			var delimiterEndIndecies = getEndIndecies(text,delimiter);
			result[delimiter] = delimiterEndIndecies;
		});
		return result;
	}

	/** @return array of ends of @param delimiter matches in @param text*/
	function getEndIndecies(text,delimiter) {
		var result = [];
		var match;
		while(match = delimiter.exec(text)) {
			result.push(delimiter.lastIndex);
		}
		result.push(text.length);	//note: otherwise end of text is not marked with delimiter, infinte loop..
		return result;
	}
	
	return splitter;
});
