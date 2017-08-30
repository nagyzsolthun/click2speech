import { buildHttpSpeech } from "./HttpSpeech";

function MockAudio(url) {
	var instances = [];
	var playCalled = false;
	var eventToListeners = {};

	MockAudio.instances.push(this);

	this.addEventListener = function(event,listener) {
		var listeners = eventToListeners[event];
		if(!listeners) {
			listeners = [];
			eventToListeners[event] = listeners;
		}
		listeners.push(listener);
	}
    this.removeEventListener = function(event,listener) {}
	this.play = function() {
        playCalled = true;
    }
	this.isPlayCalled = function() {
        return playCalled;
    }
	this.callEventListeners = function(event) {
		var eventListeners = eventToListeners[event];
		if(eventListeners) {
			eventListeners.forEach(listener => listener());
		}
	}
}
MockAudio.clearInstances = function() {
    MockAudio.instances = [];
}
MockAudio.getInstances = function() {
    return MockAudio.instances;
}
MockAudio.clearInstances();
GLOBAL.Audio = MockAudio;

function mockBuildUrl(text) {
	return text;
}

function testLengthShorterThan10(text) {
	return text.length < 10;
}

describe("HttpSpeech", () => {
	beforeEach(() => {
        MockAudio.clearInstances();
        jasmine.clock().install();
    });
    afterEach(() => jasmine.clock().uninstall());

	it("creates one HTMLAudioElement for short text", () => {
		var speech = buildHttpSpeech("text",mockBuildUrl,testLengthShorterThan10);
		expect(MockAudio.getInstances().length).toBe(1);
	});

	it("plays first Audio when play called", () => {
		var speech = buildHttpSpeech("text",mockBuildUrl,testLengthShorterThan10);
		expect(!MockAudio.getInstances()[0].isPlayCalled())
		speech.play();
		expect(MockAudio.getInstances()[0].isPlayCalled())
	});

	it("creates following HTMLAudioElements only after started received", () => {
		var speech = buildHttpSpeech("long text to be split to 3",mockBuildUrl,testLengthShorterThan10);
		expect(MockAudio.getInstances().length).toBe(1);

		MockAudio.getInstances()[0].callEventListeners("playing");
		expect(MockAudio.getInstances().length).toBe(2);

		MockAudio.getInstances()[1].callEventListeners("playing");
		expect(MockAudio.getInstances().length).toBe(3);
	});

	it("plays following HTMLAudioElements only after ended received", () => {
		var speech = buildHttpSpeech("long text to be split to 3",mockBuildUrl,testLengthShorterThan10);

		speech.play();
		expect(MockAudio.getInstances()[0].isPlayCalled());

		MockAudio.getInstances()[0].callEventListeners("playing");	// to create next Audio
		MockAudio.getInstances()[0].callEventListeners("ended");
		expect(MockAudio.getInstances()[1].isPlayCalled());

		MockAudio.getInstances()[1].callEventListeners("playing");	// to create next Audio
		MockAudio.getInstances()[1].callEventListeners("ended");
		expect(MockAudio.getInstances()[2].isPlayCalled());
	});

    it("calls start callback when started", () => {
        var startCallback = jasmine.createSpy("startCallback");
        var speech = buildHttpSpeech("text",mockBuildUrl,testLengthShorterThan10).onStart(startCallback);
        speech.play();
        MockAudio.getInstances()[0].callEventListeners("playing");
        expect(startCallback).toHaveBeenCalled();
    });

    it("calls end callback when ended", () => {
        var endCallback = jasmine.createSpy("endCallback");
        var speech = buildHttpSpeech("text",mockBuildUrl,testLengthShorterThan10).onEnd(endCallback);
        speech.play();
        MockAudio.getInstances()[0].callEventListeners("ended");
        expect(endCallback).toHaveBeenCalled();
    });

    it("calls sentenceCallback for short sentneces", () => {
        var sentenceCallback = jasmine.createSpy("sentenceCallback");
        var speech = buildHttpSpeech("First. Second.",mockBuildUrl,testLengthShorterThan10).onSentence(sentenceCallback);
        speech.play();

        MockAudio.getInstances()[0].callEventListeners("playing");	// to create next Audio
        MockAudio.getInstances()[0].callEventListeners("ended");
        jasmine.clock().tick(10);
        expect(sentenceCallback.calls.count()).toEqual(1);

        MockAudio.getInstances()[1].callEventListeners("playing");
        jasmine.clock().tick(10);
        expect(sentenceCallback.calls.count()).toEqual(2);
    });

    it("calls sentenceCallback for long sentneces (that will be split)", () => {
        var sentenceCallback = jasmine.createSpy("sentenceCallback");
        var speech = buildHttpSpeech("First one. Second one. Third one.",mockBuildUrl,testLengthShorterThan10).onSentence(sentenceCallback);
        speech.play();

        // first senetnece will be split to 2 audios
        MockAudio.getInstances()[0].callEventListeners("playing");
        MockAudio.getInstances()[0].callEventListeners("ended");
        MockAudio.getInstances()[1].callEventListeners("playing");
        MockAudio.getInstances()[1].callEventListeners("ended");
        jasmine.clock().tick(10);
        expect(sentenceCallback.calls.count()).toEqual(1);

        // when starting playing the 3rd audio, callback called again
        MockAudio.getInstances()[2].callEventListeners("playing");
        MockAudio.getInstances()[2].callEventListeners("ended");
        MockAudio.getInstances()[3].callEventListeners("playing");
        MockAudio.getInstances()[3].callEventListeners("ended");
        jasmine.clock().tick(10);
        expect(sentenceCallback.calls.count()).toEqual(2);

        // when starting playing the 4th audio, callback called again
        MockAudio.getInstances()[4].callEventListeners("playing");
        jasmine.clock().tick(10);
        expect(sentenceCallback.calls.count()).toEqual(3);
    });

    // TODO error
});
