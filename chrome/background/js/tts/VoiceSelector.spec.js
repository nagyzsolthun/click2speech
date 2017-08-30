import { getVoiceName, getDefaultVoiceName, rejectVoice } from "./VoiceSelector.js";

const tts = {
	getVoices: callback => callback([
		{voiceName:"osVoice", extensionId:null, lang:"en-US"}
		,{voiceName:"enVoice1", extensionId:1, lang:"en-US"}
		,{voiceName:"enVoice2", extensionId:1, lang:"en-US"}
		,{voiceName:"deVoice1", extensionId:1, lang:"de-DE"}
		,{voiceName:"huVoice1", extensionId:1, lang:"hu-HU"}
	])
};
const navigator = {};
const localStorage = {};
const i18n = {};

GLOBAL.navigator = navigator;
GLOBAL.chrome = {storage: {local:localStorage}, tts:tts, i18n:i18n};
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;

describe("getVoiceName", () => {
	it("gives OS voice if preferred and supports language", done => {
		localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
		i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
		navigator.language = "en";
		getVoiceName("some text", "en").then((voiceName) => {
			expect(voiceName).toEqual("osVoice");
			done();
		});
	});

	it("gives enVoice1 if preferred and supports language", done => {
		localStorage.get = (settings,callback) => callback({preferredVoice:"enVoice1"});
		i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"en",percentage:100}] });
		navigator.language = "en";
		getVoiceName("some text", "en").then((voiceName) => {
			expect(voiceName).toEqual("enVoice1");
			done();
		});
	});

	it("gives deVoice1 if language does not match preferredVoice", done => {
		localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
		i18n.detectLanguage = (text,callback) => callback({isReliable:true, languages:[{language:"de",percentage:100}] });
		navigator.language = "en";
		getVoiceName("some text", "en").then((voiceName) => {
			expect(voiceName).toEqual("deVoice1");
			done();
		});
	});

	it("gives osVoice if language recognition fails but pageLanguage matches", done => {
		localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
		i18n.detectLanguage = (text,callback) => callback({isReliable:false});
		getVoiceName("some text", "en").then((voiceName) => {
			expect(voiceName).toEqual("osVoice");
			done();
		});
	});

	it("gives deVoice1 if language recognition fails but pageLanguage matches, even if preferredTts does not match", done => {
		localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
		i18n.detectLanguage = (text,callback) => callback({isReliable:false});
		navigator.language = "en";
		getVoiceName("some text", "de").then((voiceName) => {
			expect(voiceName).toEqual("deVoice1");
			done();
		});
	});

	it("gives deVoice1 if language recognition fails, no pageLangage provided, preferredTts does not match, but navigaorlanguage matches", done => {
		localStorage.get = (settings,callback) => callback({preferredVoice:"osVoice"});
		i18n.detectLanguage = (text,callback) => callback({isReliable:false});
		navigator.language = "de";
		getVoiceName("some text", null).then((voiceName) => {
			expect(voiceName).toEqual("deVoice1");
			done();
		});
	});

	// TODO reject voice
});
