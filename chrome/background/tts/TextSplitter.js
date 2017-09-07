const DELMITERS = [ /\;\s+/, /\,\s+/, /\s+/ ];
const SENTENCE_DELMITER = /[.?!]\s+/;
const WORD_DELMITER = /([.?!,;]\s+|\s+)/;

/** @return array of strings, that match requreiments specified in @param testLength
 * @param {string} text - the text to split
 * @param {function(string):boolean} testLength - test whether text matches tts restrictions on length */
function split(text, testLength) {
	var result = [];
	splitToSentences(text)
		.map(sentence => splitSentence(sentence, testLength))
		.forEach(part => result = result.concat(part));
	return result;
}

/** @return whether given text is one array or not */
function isSentence(text) {
    var splitIndecies = sentenceSplitIndecies(text+" ");	// sentence may end with .
    if(splitIndecies.length > 1) {
        return false;
    }
    if(splitIndecies[0] != text.length+1) { // compensate for extra space
        return false;
    }
    return true;
}

function nextSentenceEnd(text, position) {
	var textBehind = text.substring(position);
	var match = SENTENCE_DELMITER.exec(textBehind);
	return match ? position + match.index + match[0].length : text.length;
}

function nextWordEnd(text, position) {
	var textBehind = text.substring(position);
	var match = WORD_DELMITER.exec(textBehind);
	return match ? position + match.index : text.length;
}

function splitToSentences(text) {
	var result = [];
	var splitIndecies = sentenceSplitIndecies(text);
	var indeciesWithStartEnd = [0].concat(splitIndecies);
	indeciesWithStartEnd.push(text.length);
	for(var i=0; i<indeciesWithStartEnd.length-1; i++) {
		var start = indeciesWithStartEnd[i];
		var end = indeciesWithStartEnd[i+1];
		result.push(text.substring(start,end));
	}
	return result;
}

function sentenceSplitIndecies(text) {
	return endIndecies(text, SENTENCE_DELMITER)
}

function splitSentence(remaining, testLength) {
	var result = [];
	while(remaining.length) {
		var splitIndex = calcHighestValueSplitIndex(remaining, testLength);
		result.push(remaining.substring(0,splitIndex));
		remaining = remaining.substring(splitIndex);
	}
	return result;
}

// find first delimiter that can be used (the highest value delimiter)
function calcHighestValueSplitIndex(text, testLength) {
	if(testLength(text)) {
		return text.length;
	}
	for(var i=0; i<DELMITERS.length; i++) {
		var splitIndex = highestEndIndex(text, DELMITERS[i], testLength);
		if(splitIndex) {
			return splitIndex;
		}
	}

	// no match (aka very long word)
	for(var i=text.length-1; i>=0; i--) {
		var part = text.substring(0,i);
		if(testLength(part)) {
			return i;
		}
	}

	return -1;	// TODO throw exception
}

function highestEndIndex(text, delimiter, testLength) {
	var indecies = endIndecies(text, delimiter);
	indecies.push(text.length);
	for(var i=indecies.length-1; i>=0; i--) {
		var index = indecies[i];
		if(testLength(text.substring(0,index))) {
			return index;
		}
	}
	return 0;
}

function endIndecies(text, delimiter) {
	var result = [];
    var match;
	var regex = new RegExp(delimiter.source, "g");
	while(match = regex.exec(text))
		result.push(regex.lastIndex);
	return result;
}

export { split, isSentence, nextSentenceEnd, nextWordEnd };
