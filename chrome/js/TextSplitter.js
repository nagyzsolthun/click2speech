/** provides functions to split a text in a way that it ends at end of sentence, at comma, or end of word */
function TextSplitter() {
	/** @return index of last match (end of it) under given limit OR -1 if no match found under limit
	 * @param text
	 * @param re the regexp to be matched - must be global!
	 * @param limit the index of last character under which we search for match
	 */
	function lastMatch(text, re, limit) {
		var result = -1;
		var regexpResult;
		while(regexpResult = re.exec(text)) {
			var index = regexpResult.index + regexpResult[0].length;
			if(index > limit || index < 0) {
				break;
			} else {
				result = index;
			}
		}
		re.lastIndex = 0;	//to reset lastIdnex counter. Otherwise regexp would count amtching from last matching index..
		return result;
	}
	
	/** @return index of last match (end of it) under given limit OR given limit or no match found
	 * @param text
	 * @param reArray the regexps to be matched: the first matching regexp under limit wins
	 * @param limit the index of last character under which we search for match*/
	function lastMatchArr(text, limit, reArray) {
		for(var i=0; i<reArray.length; i++) {
			var result = lastMatch(text, reArray[i], limit);
			if(result > -1) return result;
		}
		return limit;
	}
	
	/** @return array of strings - each string has a lower length then given limit
	 * splitting happens by given regexps
	 * @param text the text to be split
	 * @param limit maximum length of strings in result
	 * @param reArray array of regexps to use for splitting - regexps must be global!
	 */
	this.splitToLimit = function(text, limit, reArray) {
		var result = [];
		while(text.length > limit) {
			var indexOfSplit = lastMatchArr(text, limit, reArray);
			result.push(text.substr(0, indexOfSplit));
			text = text.substr(indexOfSplit);
		}
		if(text.length > 0) {
			result.push(text);
		}
		return result;
	}
}