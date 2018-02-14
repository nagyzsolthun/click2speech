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
    this.pause = function() {};
}
MockAudio.clearInstances = function() {
    MockAudio.instances = [];
}
MockAudio.getInstances = function() {
    return MockAudio.instances;
}
MockAudio.clearInstances();
global.Audio = MockAudio;

function buildUrl(text) {
    return text;
}

function testLength(text) {
    return text.length < 10;
}

describe("HttpSpeech", () => {
    beforeEach(() => {
        MockAudio.clearInstances();
        jasmine.clock().install();
    });
    afterEach(() => jasmine.clock().uninstall());

    it("creates one HTMLAudioElement for short text", () => {
        const text = "text";
        const speech = buildHttpSpeech({ text, buildUrl, testLength });

        expect(MockAudio.getInstances().length).toBe(1);
    });

    it("plays first Audio when play called", () => {
        const text = "text";
        const speech = buildHttpSpeech({ text, buildUrl, testLength });

        expect(!MockAudio.getInstances()[0].isPlayCalled())
        speech.play();
        expect(MockAudio.getInstances()[0].isPlayCalled())
    });

    it("creates following HTMLAudioElements only after started received", () => {
        const text = "long text to be split to 3";
        const speech = buildHttpSpeech({ text, buildUrl, testLength });

        expect(MockAudio.getInstances().length).toBe(1);
        MockAudio.getInstances()[0].callEventListeners("playing");
        expect(MockAudio.getInstances().length).toBe(2);

        MockAudio.getInstances()[1].callEventListeners("playing");
        expect(MockAudio.getInstances().length).toBe(3);
    });

    it("plays following HTMLAudioElements only after ended received", () => {
        const text = "long text to be split to 3";
        const speech = buildHttpSpeech({ text, buildUrl, testLength });

        speech.play();
        expect(MockAudio.getInstances()[0].isPlayCalled());

        MockAudio.getInstances()[0].callEventListeners("playing");    // to create next Audio
        MockAudio.getInstances()[0].callEventListeners("ended");
        expect(MockAudio.getInstances()[1].isPlayCalled());

        MockAudio.getInstances()[1].callEventListeners("playing");    // to create next Audio
        MockAudio.getInstances()[1].callEventListeners("ended");
        expect(MockAudio.getInstances()[2].isPlayCalled());
    });

    it("calls start callback when started", () => {
        const text = "text";
        const startCallback = jasmine.createSpy("startCallback");
        const speech = buildHttpSpeech({ text, buildUrl, testLength }).onStart(startCallback);
        speech.play();
        MockAudio.getInstances()[0].callEventListeners("playing");
        expect(startCallback).toHaveBeenCalled();
    });

    it("calls end callback when ended", () => {
        const text = "text";
        const endCallback = jasmine.createSpy("endCallback");
        const speech = buildHttpSpeech({ text, buildUrl, testLength }).onEnd(endCallback);

        speech.play();
        MockAudio.getInstances()[0].callEventListeners("ended");
        expect(endCallback).toHaveBeenCalled();
    });

    it("calls sentenceCallback for short sentneces", () => {
        const text = "First. Second.";
        const sentenceCallback = jasmine.createSpy("sentenceCallback");
        const speech = buildHttpSpeech({ text, buildUrl, testLength }).onSentence(sentenceCallback);
        speech.play();

        MockAudio.getInstances()[0].callEventListeners("playing");    // to create next Audio
        MockAudio.getInstances()[0].callEventListeners("ended");
        jasmine.clock().tick(10);
        expect(sentenceCallback.calls.count()).toEqual(1);

        MockAudio.getInstances()[1].callEventListeners("playing");
        jasmine.clock().tick(10);
        expect(sentenceCallback.calls.count()).toEqual(2);
    });

    it("calls sentenceCallback for long sentneces (that will be split)", () => {
        const text = "First one. Second one. Third one.";
        const sentenceCallback = jasmine.createSpy("sentenceCallback");
        const speech = buildHttpSpeech({ text, buildUrl, testLength }).onSentence(sentenceCallback);
        speech.play();

        // first senetence will be split to 2 audios
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
