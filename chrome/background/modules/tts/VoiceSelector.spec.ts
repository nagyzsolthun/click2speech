import { getVoice, getDefaultVoiceName, getSortedVoices } from "./VoiceSelector";

declare var global;

const voices = [
    {name:"osVoice", lang:"en-US", localService: true},
    {name:"enVoice1", lang:"en-US"},
    {name:"enVoice2", lang:"en-US"},
    {name:"deVoice1", lang:"de-DE"},
    {name:"deVoice2", lang:"de-DE"},
    {name:"huVoice", lang:"hu-HU"},
]
const localStorage = {} as any;
const i18n = {} as any;
const navigator = {} as any;

global.chrome = {storage: {local:localStorage}, i18n:i18n};
global.speechSynthesis = {} as any;
global.navigator = navigator;

const SOME_TEXT = "some text";

describe("getSortedVoices", () => {

    let onVoicesChange;
    beforeEach(() => {
        onVoicesChange = null;
        global.speechSynthesis.addEventListener = (_,callback) => onVoicesChange = callback;
        global.speechSynthesis.removeEventListener = () => {};
        spyOn(global.speechSynthesis, "addEventListener").and.callThrough();
        spyOn(global.speechSynthesis, "removeEventListener");
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
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("osVoice");
    });

    it("gives OS voice if preferred and no langauge detected", async () => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:false});
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("osVoice");
    });

    it("gives enVoice1 if preferred and supports language", async () => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"enVoice1"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("enVoice1");
    });

    it("gives deVoice1 if language does not match preferredVoice", async () => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"de",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("deVoice1");
    });

    it("gives huVoice if langauge is hu, but preferredVoice is different", async () => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"hu",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice.name).toEqual("huVoice");
    });

    it("gives null if detected language is not supported", async () => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"fr",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, []);
        expect(voice).toBeFalsy();
    });

    it("gives enVoice1 if OsVoice is disabled", async () => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, ["osVoice"]);
        expect(voice.name).toEqual("enVoice1");
    });

    it("gives enVoice2 if enVoice1 and OsVoice are disabled", async () => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, ["osVoice","enVoice1"]);
        expect(voice.name).toEqual("enVoice2");
    });

    it("gives null if all voices matching language are disabled", async () => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        const voice = await getVoice(SOME_TEXT, ["osVoice","enVoice1","enVoice2"]);
        expect(voice).toBeFalsy();
    });

    it("gives OS voice if matching language but no valid preferredVoice", async () => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"non-existent"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
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
