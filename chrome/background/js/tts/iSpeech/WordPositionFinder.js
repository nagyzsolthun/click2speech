define([], function() {
	const DELIMITER = /[\s\[\]()]/g;

	var wordPositionFinder = {};

	/** @return array of {start,end} positions of words. end is the first character not part of the word */
	wordPositionFinder.getPositions = function(text) {
		//end of each DELIMITER is start-of-word, start is end-of-word	
		var result = [];
		result[0] = {};
		var match;
 		while(match = DELIMITER.exec(text)) {
			var DELIMITERStart = match.index;
			var DELIMITEREnd = DELIMITER.lastIndex;
			result[result.length-1].end = DELIMITERStart;
			result[result.length] = {};	//new marker
			result[result.length-1].start = DELIMITEREnd;
		}
		result[0].start = 0;
		result[result.length-1].end = text.length;

		return result.filter(function(o) {
			if(o.start === o.end) return false;	//empty words
			return true;
		});
	}

	return wordPositionFinder;
});
