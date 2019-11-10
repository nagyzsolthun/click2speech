import { getVoiceName, getDefaultVoiceName, updateDisabledVoices } from "./VoiceSelector.js";

const tts = {
    getVoices: callback => callback([
        {voiceName:"osVoice", extensionId:null, lang:"en"},
        {voiceName:"enVoice1", extensionId:1, lang:"en"},
        {voiceName:"enVoice2", extensionId:1, lang:"en"},
        {voiceName:"deVoice1", extensionId:1, lang:"de"},
        {voiceName:"deVoice2", extensionId:1, lang:"de"},
        {voiceName:"huVoice", extensionId:1, lang:"hu"},
    ])
};
const localStorage = {};
const i18n = {};
const navigator = {};

const SOME_TEXT = "some text";

global.chrome = {storage: {local:localStorage}, tts:tts, i18n:i18n};
global.navigator = navigator;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;

describe("getVoiceName", () => {
    beforeEach(() => {
        navigator.language = "en-US";    // used when no preferredVoice is given
        updateDisabledVoices([]);
    });

    it("gives OS voice if preferred and supports language", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        getVoiceName(SOME_TEXT).then((voiceName) => {
            expect(voiceName).toEqual("osVoice");
            done();
        });
    });

    it("gives OS voice if preferred and no langauge detected", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:false});
        getVoiceName(SOME_TEXT).then((voiceName) => {
            expect(voiceName).toEqual("osVoice");
            done();
        });
    });

    it("gives enVoice1 if preferred and supports language", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"enVoice1"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        getVoiceName(SOME_TEXT).then((voiceName) => {
            expect(voiceName).toEqual("enVoice1");
            done();
        });
    });

    it("gives deVoice1 if language does not match preferredVoice", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"de",percentage:100}] });
        getVoiceName(SOME_TEXT).then((voiceName) => {
            expect(voiceName).toEqual("deVoice1");
            done();
        });
    });

    it("gives huVoice if langauge is hu, but preferredVoice is different", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"hu",percentage:100}] });
        getVoiceName(SOME_TEXT).then((voiceName) => {
            expect(voiceName).toEqual("huVoice");
            done();
        });
    });

    it("rejects if detected language is not supported", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"fr",percentage:100}] });
        getVoiceName(SOME_TEXT).then(null, () => done());
    });

    it("gives enVoice1 if OsVoice is disabled", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        updateDisabledVoices(["osVoice"]);
        getVoiceName(SOME_TEXT).then((voiceName) => {
            expect(voiceName).toEqual("enVoice1");
            done();
        });
    });

    it("gives enVoice2 if enVoice1 and OsVoice are disabled", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        updateDisabledVoices(["osVoice","enVoice1"]);
        getVoiceName(SOME_TEXT).then((voiceName) => {
            expect(voiceName).toEqual("enVoice2");
            done();
        });
    });

    it("rejects if all voices matching language are disabled", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        updateDisabledVoices(["osVoice","enVoice1","enVoice2"]);
        getVoiceName(SOME_TEXT).then(null, () => done());
    });

    it("gives OS voice if matching language but no valid preferredVoice", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"non-existent"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        getVoiceName(SOME_TEXT).then((voiceName) => {
            expect(voiceName).toEqual("osVoice");
            done();
        });
    });
});

describe("getDefaultVoiceName", () => {
    it("returns osVoice if it matches navigator language", done => {
        navigator.language = "en-US";
        getDefaultVoiceName().then(voiceName => {
            expect(voiceName).toEqual("osVoice");
            done();
        });
    });
    it("returns deVoice1 if osVoice does not match navigator language", done => {
        navigator.language = "de-DE";
        getDefaultVoiceName().then(voiceName => {
            expect(voiceName).toEqual("deVoice1");
            done();
        });
    });
});