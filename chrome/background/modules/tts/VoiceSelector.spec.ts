import { getVoice, getDefaultVoiceName, getSortedVoices } from "./VoiceSelector";
import { browser } from "webextension-polyfill-ts"

jest.mock("webextension-polyfill-ts", () => {
    return {
      browser: {
          storage: { local: {get: jest.fn()}},
          i18n: { detectLanguage: jest.fn()}
      }  
    };
});

function mockLocalStorage(storage) {
    (browser.storage.local.get as any).mockImplementation(() => storage);
}

function mockDetectLangueage(detection) {
    (browser.i18n.detectLanguage as any).mockImplementation(() => detection);
}

const voices = [
    {name:"osVoice", lang:"en-US", localService: true},
    {name:"enVoice1", lang:"en-US"},
    {name:"enVoice2", lang:"en-US"},
    {name:"deVoice1", lang:"de-DE"},
    {name:"deVoice2", lang:"de-DE"},
    {name:"huVoice", lang:"hu-HU"},
]
const navigator = {} as any;

declare var global;
global.speechSynthesis = {} as any;
global.navigator = navigator;

const SOME_TEXT = "some text";

describe("getSortedVoices", () => {

    let onVoicesChange;
    beforeEach(() => {
        onVoicesChange = null;
        global.speechSynthesis.addEventListener = (_,callback) => onVoicesChange = callback;
        global.speechSynthesis.removeEventListener = () => {};
        jest.spyOn(global.speechSynthesis, "addEventListener");
        jest.spyOn(global.speechSynthesis, "removeEventListener");
    });

    it("provides voices sync if available", async () => {
        global.speechSynthesis.getVoices = () => voices;

        // check subscription
        const voicesPromise = getSortedVoices();
        expect(global.speechSynthesis.addEventListener).not.toHaveBeenCalled();
        expect(onVoicesChange).toBeFalsy();

        const result = await voicesPromise;
        expect(result.length).toBe(voices.length);
    });

    it("provides voices async when available", async () => {
        global.speechSynthesis.getVoices = () => [];

        // check subscription
        const voicesPromise = getSortedVoices();
        expect(global.speechSynthesis.addEventListener).toHaveBeenCalled();
        expect(onVoicesChange).toBeTruthy();

        // voices received
        global.speechSynthesis.getVoices = () => voices;
        onVoicesChange();
        const result = await voicesPromise;
        expect(result.length).toBe(voices.length)
        expect(global.speechSynthesis.removeEventListener).toHaveBeenCalled();
    });

    it("provides empty array async when not available", async () => {
        global.speechSynthesis.getVoices = () => [];

        // check subscription
        const voicesPromise = getSortedVoices();
        expect(global.speechSynthesis.addEventListener).toHaveBeenCalled();
        expect(onVoicesChange).toBeTruthy();

        // should time out when onVoicesChange not called
        const result = await voicesPromise;
        expect(result.length).toBe(0);
        expect(global.speechSynthesis.removeEventListener).toHaveBeenCalled();
    });
});

describe("getVoice", () => {
    beforeEach(() => {
        navigator.language = "en-US";    // used when no preferredVoice is given
        global.speechSynthesis.getVoices = () => voices
    });

    it("gives OS voice if preferred and supports language", async () => {
        mockLocalStorage({preferredVoice:"osVoice"});
        mockDetectLangueage({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("osVoice");
    });

    it("gives OS voice if preferred and no langauge detected", async () => {
        mockLocalStorage({preferredVoice:"osVoice"});
        mockDetectLangueage({isReliable:false});
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("osVoice");
    });

    it("gives enVoice1 if preferred and supports language", async () => {
        mockLocalStorage({preferredVoice:"enVoice1"});
        mockDetectLangueage({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("enVoice1");
    });

    it("gives deVoice1 if language does not match preferredVoice", async () => {
        mockLocalStorage({preferredVoice:"osVoice"});
        mockDetectLangueage({isReliable:true, languages:[{language:"de",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("deVoice1");
    });

    it("gives huVoice if langauge is hu, but preferredVoice is different", async () => {
        mockLocalStorage({preferredVoice:"osVoice"});
        mockDetectLangueage({isReliable:true, languages:[{language:"hu",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("huVoice");
    });

    it("gives null if detected language is not supported", async () => {
        mockLocalStorage({preferredVoice:"osVoice"});
        mockDetectLangueage({isReliable:true, languages:[{language:"fr",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice).toBeFalsy();
    });

    it("gives enVoice1 if OsVoice is disabled", async () => {
        mockLocalStorage({preferredVoice:"osVoice"});
        mockDetectLangueage({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, ["osVoice"]);
        expect(voice.name).toEqual("enVoice1");
    });

    it("gives enVoice2 if enVoice1 and OsVoice are disabled", async () => {
        mockLocalStorage({preferredVoice:"osVoice"});
        mockDetectLangueage({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, ["osVoice","enVoice1"]);
        expect(voice.name).toEqual("enVoice2");
    });

    it("gives null if all voices matching language are disabled", async () => {
        mockLocalStorage({preferredVoice:"osVoice"});
        mockDetectLangueage({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, ["osVoice","enVoice1","enVoice2"]);
        expect(voice).toBeFalsy();
    });

    it("gives OS voice if matching language but no valid preferredVoice", async () => {
        mockLocalStorage({preferredVoice:"non-existent"});
        mockDetectLangueage({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("osVoice");
    });
});

describe("getDefaultVoiceName", () => {
    beforeEach(() => {
        global.speechSynthesis.getVoices = () => voices
    });

    it("returns osVoice", async () => {
        navigator.language = "en-US";
        const voiceName = await getDefaultVoiceName();
        expect(voiceName).toEqual("osVoice");
    });
});
