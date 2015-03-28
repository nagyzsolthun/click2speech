//TODO rethink this code
/** provides functions to split a text in a way that it ends at end of sentence, at comma, or end of word */
define(function() {
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
		re.lastIndex = 0;	//to reset lastIdnex counter. Otherwise regexp would count matching from last matching index..
		return result;
	}
	
	/** @return index of last match (end of it) under given limit OR given limit if no match found
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
	
	/** @return the index of the end of given word
	 @param c.text the text with no duplicate spaces
	 @param c.index the index of word*/
	function indexOfWordEnd(c) {
		var result = 0;
		var splitText = c.text.split(/[ ,.]/g);
		for(var i=0; i<c.index && splitText[i] != null; i++) {
			result += splitText[i].length + 1;
		}
		return result;
	}
	
	//================================================= public =================================================
	/** the object to be returned */
	var splitter = {};
	
	/** @return array of strings - each string has a lower length then given limit in characters
	 * splitting happens by given regexps
	 * @param c.text the text to be split
	 * @param c.limit maximum length of strings in result
	 * @param c.reArray array of regexps to use for splitting - regexps must be global!
	 */
	splitter.splitToChar = function(c) {
		var result = [];
		while(c.text.length > c.limit) {
			var indexOfSplit = lastMatchArr(c.text, c.limit, c.reArray);
			result.push(c.text.substr(0, indexOfSplit));
			c.text = c.text.substr(indexOfSplit);
		}
		if(c.text.length > 0) {
			result.push(c.text);
		}
		return result;
	}
	
	/** @return array of strings - each string has a lower length then given limit in words
	 * splitting happens by given regexps
	 * @param c.text the text to be split
	 * @param c.limit maximum number of words in the result
	 * @param c.reArray array of regexps to use for splitting - regexps must be global!
	 */
	splitter.splitToWord = function(c) {
		var result = [];
		
		var clearText = c.text.replace(/\s{2,}/g,' ');	//removes duplicate spaces
		
		var limitChar = indexOfWordEnd({text:clearText,index:c.limit});
		while(clearText.length > limitChar) {
			var indexOfSplit = lastMatchArr(clearText, limitChar, c.reArray);
			result.push(clearText.substr(0, indexOfSplit));
			clearText = clearText.substr(indexOfSplit);
			limitChar = indexOfWordEnd({text:clearText,index:c.limit});
		}
		if(clearText.length > 0) {
			result.push(clearText);
		}
		
		return result;
	}
	
	return splitter;
});