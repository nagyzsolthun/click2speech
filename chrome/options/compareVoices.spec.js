import compareVoices from "./compareVoices.js"

describe("compareVoices", () => {
    it("selects higher language", () => {
        const voice1 = {voiceName:"voiceName1", lang:"en", gender:"male", extensionId:null};
        const voice2 = {voiceName:"voiceName2", lang:"de", gender:"female", extensionId:null};
        expect(compareVoices(voice1,voice2)).toBe(1);
    });
    it("selects OS voice", () => {
        const voice1 = {voiceName:"voiceName1", lang:"en", gender:"female", extensionId:null};
        const voice2 = {voiceName:"voiceName2", lang:"en", gender:"female", extensionId:1};
        expect(compareVoices(voice1,voice2)).toBe(1);
    });
    it("selects Google voice over IBM", () => {
        const voice1 = {voiceName:"Google voice", lang:"en", gender:"female", extensionId:null};
        const voice2 = {voiceName:"IBM voice", lang:"en", gender:"female", extensionId:null};
        expect(compareVoices(voice1,voice2)).toBe(1);
    });
    it("selects female voice", () => {
        const voice1 = {voiceName:"voiceName1", lang:"en", gender:"female", extensionId:null};
        const voice2 = {voiceName:"voiceName2", lang:"en", gender:"male", extensionId:null};
        expect(compareVoices(voice1,voice2)).toBe(1);
    });
    it("selects alphabetically lower voice", () => {
        const voice1 = {voiceName:"voiceNameA", lang:"en", gender:"female", extensionId:null};
        const voice2 = {voiceName:"voiceNameB", lang:"en", gender:"female", extensionId:null};
        expect(compareVoices(voice1,voice2)).toBe(1);
    });
});
