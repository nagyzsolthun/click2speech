import { getVoiceName, getDefaultVoiceName, rejectVoice } from "./VoiceSelector.js";

const tts = {
	getVoices: callback => callback([
		{voiceName:"osVoice", extensionId:null, lang:"en", gender:"female"}
		,{voiceName:"enVoice1", extensionId:1, lang:"en", gender:"female"}
		,{voiceName:"enVoice2", extensionId:1, lang:"en", gender:"male"}
		,{voiceName:"deVoice1", extensionId:1, lang:"de", gender:"female"}
		,{voiceName:"deVoice2", extensionId:1, lang:"de", gender:"male"}
		,{voiceName:"huVoice", extensionId:1, lang:"hu", gender:"female"}
	])
};
const localStorage = {};
const i18n = {};

const SOME_TEXT = "some text";

GLOBAL.chrome = {storage: {local:localStorage}, tts:tts, i18n:i18n};
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;

describe("getVoiceName", () => {
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

	it("gives male deVoice if language does not match preferredVoice and preferredVoice is male", done => {
		localStorage.get = (settings,callback) => callback({preferredVoice:"enVoice2"});
		i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"de",percentage:100}] });
		getVoiceName(SOME_TEXT).then((voiceName) => {
			expect(voiceName).toEqual("deVoice2");
			done();
		});
	});

	it("gives male deVoice if language does not match preferredVoice and preferredVoice is male", done => {
		localStorage.get = (settings,callback) => callback({preferredVoice:"enVoice2"});
		i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"de",percentage:100}] });
		getVoiceName(SOME_TEXT).then((voiceName) => {
			expect(voiceName).toEqual("deVoice2");
			done();
		});
	});

	it("gives osVoice if language does not match preferredVoice and preferredVoice is female", done => {
		localStorage.get = (settings,callback) => callback({preferredVoice:"deVoice1"});
		i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
		getVoiceName(SOME_TEXT).then((voiceName) => {
			expect(voiceName).toEqual("osVoice");
			done();
		});
	});

	it("gives huVoice if langauge is hu, but preferredVoice and gender is different", done => {
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
});
