define([], function() {
	/* matching the word itslef would be nicer (than matching delimiters)
	 * however characters of different languages are hard to match (a-z doesnt work in case of e.g. Hungarian letters) */
	const DELIMITERS = /[\s\[\]()]/g;
	const START_SPECIAL_CHARATERS = /^[.!?;:,\-–\"\']+/g;
	const END_SPECIAL_CHARATERS = /[.!?;:,\-–\"\']+$/g;

	var wordPositionFinder = {};

	/** @return array of {start,end,word} positions of words. end is the first character not part of the word */
	wordPositionFinder.getPositions = function(text) {
		//end of each delimiter is start-of-word, start is end-of-word	
		var result = [];
		result[0] = {};
		var match;
 		while(match = DELIMITERS.exec(text)) {
			var delimiterStart = match.index;
			var delimiterEnd = DELIMITERS.lastIndex;
			result[result.length-1].end = delimiterStart;
			result[result.length] = {};	//new marker
			result[result.length-1].start = delimiterEnd;
		}
		result[0].start = 0;
		result[result.length-1].end = text.length;

		result.forEach(function(marker) {marker.word = text.substring(marker.start,marker.end)});	//set word field

		result.forEach(removeSorroundingSpecialCharacters);	//empty words may appear - we keep them because iSpeech counts them too
		return result;
	}

	function removeSorroundingSpecialCharacters(marker) {
		var startMatchArr = marker.word.match(START_SPECIAL_CHARATERS);
		if(startMatchArr) {
			var match = startMatchArr[0];	//always 1 item, because only the begenning is matched
			marker.word = marker.word.substring(match.length);
			marker.start += match.length;
		}
		var endMatchArr = marker.word.match(END_SPECIAL_CHARATERS);
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
