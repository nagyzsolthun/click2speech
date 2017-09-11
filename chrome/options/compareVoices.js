export default function(voice1,voice2) {
    var result = compareExtensionId(voice1.extensionId, voice2.extensionId);
    result = result ? result : compareProvider(voice1.voiceName, voice2.voiceName);
    result = result ? result : compareLangs(voice1.lang, voice2.lang);
    result = result ? result : compareGender(voice1.gender, voice2.gender);
    result = result ? result : compareVoiceName(voice1.voiceName, voice2.voiceName);
    return result;
}

const langs = ["en-US","en-GB","en","de","fr","es-ES","es-US"]
function calcLanValue(voiceLan) {
    const index = langs.findIndex(lang => voiceLan.startsWith(lang));
    if(index > -1) return langs.length - index;
    else return 0;
}

function compareLangs(lang1,lang2) {
    const langIndex1 = langs.findIndex(lang => lang1.startsWith(lang));
    const langIndex2 = langs.findIndex(lang => lang2.startsWith(lang));

    if(langIndex1 == langIndex2) return 0;

    // one of the languages missing
    if(langIndex2 == -1) return 1;
    if(langIndex1 == -1) return -1;

    // both in langs
    if(langIndex1 < langIndex2) return 1;
    if(langIndex1 > langIndex2) return -1;
}

function compareExtensionId(id1,id2) {
    if(id1 == null &&  id2 != null) return 1;   // null extensionId wins
    if(id1 != null &&  id2 == null) return -1;
    return 0;
}

function compareProvider(voiceName1,voiceName2) {
    const value1 = voiceName1.startsWith("IBM") ? 0 : 10;
    const value2 = voiceName2.startsWith("IBM") ? 0 : 10;

    if(value1 > value2) return 1;
    if(value1 < value2) return -1;
    return 0;
}

function compareGender(gender1,gender2) {
    if(gender1 == gender2) return 0;
    if(gender1 == "female") return 1;
    if(gender2 == "female") return -1;
}

function compareVoiceName(voiceName1,voiceName2) {
    if(voiceName1 == voiceName2) return 0;
    if(voiceName1 < voiceName2) return 1;   // alphabetically lower voice wins (A wins over B)
    if(voiceName1 > voiceName2) return -1;
}
