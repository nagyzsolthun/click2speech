import * as textSplitter from "./TextSplitter.js";

function testLengthShorterThan40(text) {
	return text.length < 40;
}

describe("textSplitter.split", () => {
	it("doesn't split short texts", () => {
		var result = textSplitter.split("short text", testLengthShorterThan40);
		var expected = ["short text"];
		expect(result).toEqual(expected);
	});
	it("splits by sentence end", () => {
		var result = textSplitter.split("This is the first sentence. This is the second sentence.", testLengthShorterThan40);
		var expected = ["This is the first sentence. ","This is the second sentence."];
		expect(result).toEqual(expected);
	});
	it("splits by sentence end - short sentence", () => {
		var result = textSplitter.split("This. Is. Quite. A. Few. Sentences.", testLengthShorterThan40);
		var expected = ["This. ", "Is. ", "Quite. ", "A. ", "Few. ", "Sentences."];
		expect(result).toEqual(expected);
	});
	it("splits by comma", () => {
		var result = textSplitter.split("This is the first part, this is the second part, this is the third part.", testLengthShorterThan40);
		var expected = ["This is the first part, ","this is the second part, ", "this is the third part."];
		expect(result).toEqual(expected);
	});
    it("splits by comma only where split is necessary", () => {
		var result = textSplitter.split("This is the first part of the text, this isn't, to include comma, this part is quite long again.", testLengthShorterThan40);
		var expected = ["This is the first part of the text, ","this isn't, to include comma, ", "this part is quite long again."];
		expect(result).toEqual(expected);
	});
	it("splits by character in case of long word", () => {
		var result = textSplitter.split("ThisIsAVeryLongWordDefinitelyMoreThan40Letters", testLengthShorterThan40);
		var expected = ["ThisIsAVeryLongWordDefinitelyMoreThan40", "Letters"];
		expect(result).toEqual(expected);
	});
	it("splits senetence correctly in case of trailing space", () => {
		var result = textSplitter.split("Sentence. ", testLengthShorterThan40);
		var expected = ["Sentence. "];
		expect(result).toEqual(expected);
	});
	it("splits sentences correctly in case of several spaces", () => {
		var result = textSplitter.split("   First sentence.   Second one.  Third one.  ", testLengthShorterThan40);
		var expected = ["   First sentence.   ", "Second one.  ", "Third one.  "];
		expect(result).toEqual(expected);
	});
	it("splits correctly in case of several questions", () => {
		var result = textSplitter.split("First sentence? Second one. Third one!", testLengthShorterThan40);
		var expected = ["First sentence? ", "Second one. ", "Third one!"];
		expect(result).toEqual(expected);
	});

});

describe("textSplitter.isSentence", () => {
	it("recognizes that text ending with '.' is a sentence", () => {
		var result = textSplitter.isSentence("Short sentence.");
		expect(result).toBe(true);
	});
    it("recognizes that text ending with '. ' is a sentence", () => {
		var result = textSplitter.isSentence("Short sentence. ");
		expect(result).toBe(true);
	});
    it("recognizes that 2 sentences is not sentence", () => {
		var result = textSplitter.isSentence("First Sentence. Second one.");
		expect(result).toBe(false);
	});
    it("recognizes that question is sentence", () => {
		var result = textSplitter.isSentence("Is this real life?");
		expect(result).toBe(true);
	});
    it("recognizes that exclamination is sentence", () => {
		var result = textSplitter.isSentence("It is!");
		expect(result).toBe(true);
	});
    it("recognizes that some random text is no sentence", () => {
		var result = textSplitter.isSentence("random text");
		expect(result).toBe(false);
	});
    it("doesnt break for empty string", () => {
		var result = textSplitter.isSentence("");
		expect(result).toBe(false);
	});
});

describe("textSplitter.nextSentenceEnd", () => {
	it("returns end of sentence for one word", () => {
		var result = textSplitter.nextSentenceEnd("Short sentence.", 0);
		expect(result).toBe(15);
	});
	it("returns end of first sentence when position is less than sentenceEnd", () => {
		var result = textSplitter.nextSentenceEnd("First Sentence? Second setnence.", 13);
		expect(result).toBe(16);
	});
	it("returns end of second sentence when position is in it", () => {
		var result = textSplitter.nextSentenceEnd("First Sentence. Second setnence.", 16);
		expect(result).toBe(32);
	});
});

describe("textSplitter.nextWordEnd", () => {
	it("returns end of word for one word", () => {
		var result = textSplitter.nextWordEnd("word", 0);
		expect(result).toBe(4);
	});
	it("returns end of word for two words", () => {
		var result = textSplitter.nextWordEnd("word another", 0);
		expect(result).toBe(4);
	});
	it("returns end of second word for two words with offset", () => {
		var result = textSplitter.nextWordEnd("word another", 5);
		expect(result).toBe(12);
	});
	it("returns end of word for one word with sentence end", () => {
		var result = textSplitter.nextWordEnd("word. ", 0);
		expect(result).toBe(4);
	});
});
