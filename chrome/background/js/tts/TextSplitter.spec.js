import * as textSplitter from "./TextSplitter.js";

function testLengthShorterThan40(text) {
	return text.length < 40;
}

describe("textSplitter.split", () => {
	it("doesn't split short texts", () => {
		var result = textSplitter.split("short text", testLengthShorterThan40);
		var expected = ["short text"];
		expect(result).toEqual(expected)
	});
	it("splits by sentence end", () => {
		var result = textSplitter.split("This is the first sentence. This is the second sentence.", testLengthShorterThan40);
		var expected = ["This is the first sentence. ","This is the second sentence."];
		expect(result).toEqual(expected)
	});
	it("splits by sentence end - short sentence", () => {
		var result = textSplitter.split("This. Is. Quite. A. Few. Sentences.", testLengthShorterThan40);
		var expected = ["This. ", "Is. ", "Quite. ", "A. ", "Few. ", "Sentences."];
		expect(result).toEqual(expected)
	});
	it("splits by comma", () => {
		var result = textSplitter.split("This is the first part, this is the second part, this is the third part.", testLengthShorterThan40);
		var expected = ["This is the first part, ","this is the second part, ", "this is the third part."];
		expect(result).toEqual(expected)
	});
    it("splits by comma only where split is necessary", () => {
		var result = textSplitter.split("This is the first part of the text, this isn't, to include comma, this part is quite long again.", testLengthShorterThan40);
		var expected = ["This is the first part of the text, ","this isn't, to include comma, ", "this part is quite long again."];
		expect(result).toEqual(expected)
	});
	it("splits by character in case of long word", () => {
		var result = textSplitter.split("ThisIsAVeryLongWordDefinitelyMoreThan40Letters", testLengthShorterThan40);
		var expected = ["ThisIsAVeryLongWordDefinitelyMoreThan40", "Letters"];
		expect(result).toEqual(expected)
	});
    // TODO many space characters?
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
