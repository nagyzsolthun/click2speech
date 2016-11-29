define([], function() {
	/* matching the valid characters of words would be nicer
	 * however characters of different languages are hard to match (a-z doesnt work in case of e.g. Hungarian letters)
	 * blacklist is used instead */
	const WORD_CHARACTERS = /[^\s\[\]()]+/g;
	const WORD_SPECIAL_CHARATERS_START = /^[.!?;:,\-–\"\']+/g;
	const WORD_SPECIAL_CHARATERS_END = /[.!?;:,\-–\"\']+$/g;

	var wordPositionFinder = {};

	/** @return array of {start,end,word} positions of words. end is the first character not part of the word */
	wordPositionFinder.getPositions = function(text) {
		//end of each delimiter is start-of-word, start is end-of-word	
		var result = [];
		var match;
 		while(match = WORD_CHARACTERS.exec(text)) {
			var start = match.index;
			var end = WORD_CHARACTERS.lastIndex;
			result.push({start:start, end:end});
		}

		result.forEach(function(marker) {marker.word = text.substring(marker.start,marker.end)});	//set word field
		result.forEach(removeSorroundingSpecialCharacters);	//empty words may appear - we keep them because iSpeech counts them too
		return result;
	}

	function removeSorroundingSpecialCharacters(marker) {
		var startMatchArr = marker.word.match(WORD_SPECIAL_CHARATERS_START);
		if(startMatchArr) {
			var match = startMatchArr[0];	//always 1 item, because only the begenning is matched
			marker.word = marker.word.substring(match.length);
			marker.start += match.length;
		}
		var endMatchArr = marker.word.match(WORD_SPECIAL_CHARATERS_END);
		if(endMatchArr) {
			var match = endMatchArr[0];	//always 1 item, because only the end is matched
			marker.word = marker.word.substring(0, marker.word.length-match.length);
			marker.end -= match.length;
		}
		return marker;
	}

	/** @return the part of @param text that matches the getPositions logic */
	wordPositionFinder.matchingPart = function(text) {
		var position = wordPositionFinder.getPositions(text)[0];
		return position ? position.word : "";
	}

	return wordPositionFinder;
});
