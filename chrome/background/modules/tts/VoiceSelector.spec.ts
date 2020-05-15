import { getVoice, getDefaultVoiceName } from "./VoiceSelector";

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

const SOME_TEXT = "some text";

global["chrome"] = {storage: {local:localStorage}, i18n:i18n};
global["speechSynthesis"] = {getVoices: () => voices};
global["navigator"] = navigator;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;

describe("getVoice", () => {
    beforeEach(() => {
        navigator.language = "en-US";    // used when no preferredVoice is given
    });

    it("gives OS voice if preferred and supports language", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        getVoice(SOME_TEXT, []).then((voice) => {
            expect(voice.name).toEqual("osVoice");
            done();
        });
    });

    it("gives OS voice if preferred and no langauge detected", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:false});
        getVoice(SOME_TEXT, []).then((voice) => {
            expect(voice.name).toEqual("osVoice");
            done();
        });
    });

    it("gives enVoice1 if preferred and supports language", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"enVoice1"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        getVoice(SOME_TEXT, []).then((voice) => {
            expect(voice.name).toEqual("enVoice1");
            done();
        });
    });

    it("gives deVoice1 if language does not match preferredVoice", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"de",percentage:100}] });
        getVoice(SOME_TEXT, []).then((voice) => {
            expect(voice.name).toEqual("deVoice1");
            done();
        });
    });

    it("gives huVoice if langauge is hu, but preferredVoice is different", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"hu",percentage:100}] });
        getVoice(SOME_TEXT, []).then((voice) => {
            expect(voice.name).toEqual("huVoice");
            done();
        });
    });

    it("rejects if detected language is not supported", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"fr",percentage:100}] });
        getVoice(SOME_TEXT, []).then(null, () => done());
    });

    it("gives enVoice1 if OsVoice is disabled", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        getVoice(SOME_TEXT, ["osVoice"]).then((voice) => {
            expect(voice.name).toEqual("enVoice1");
            done();
        });
    });

    it("gives enVoice2 if enVoice1 and OsVoice are disabled", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        getVoice(SOME_TEXT, ["osVoice","enVoice1"]).then((voice) => {
            expect(voice.name).toEqual("enVoice2");
            done();
        });
    });

    it("rejects if all voices matching language are disabled", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        getVoice(SOME_TEXT, ["osVoice","enVoice1","enVoice2"]).then(null, () => done());
    });

    it("gives OS voice if matching language but no valid preferredVoice", done => {
        localStorage.get = (settings,callback) => callback({preferredVoice:"non-existent"});
        i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
        getVoice(SOME_TEXT, []).then((voice) => {
            expect(voice.name).toEqual("osVoice");
            done();
        });
    });
});

describe("getDefaultVoiceName", () => {
    it("returns osVoice", done => {
        navigator.language = "en-US";
        getDefaultVoiceName().then(voiceName => {
            expect(voiceName).toEqual("osVoice");
            done();
        });
    });
});
