const LANGUAGES = ["en-US", "en-GB", "en", "de", "fr", "es-ES", "es-US"]

export default function (voice1: chrome.tts.TtsVoice, voice2: chrome.tts.TtsVoice) {
    var result = compareExtensionId((voice1 as any).extensionId, (voice2 as any).extensionId);
    result = result ? result : compareProvider(voice1.voiceName, voice2.voiceName);
    result = result ? result : compareLangs(voice1.lang, voice2.lang);
    result = result ? result : compareVoiceName(voice1.voiceName, voice2.voiceName);
    return result;
}

function calcLanValue(voiceLan: string) {
    const index = LANGUAGES.findIndex(lang => voiceLan.startsWith(lang));
    if (index > -1) return LANGUAGES.length - index;
    else return 0;
}

function compareLangs(lang1: string, lang2: string) {
    const langIndex1 = LANGUAGES.findIndex(lang => lang1.startsWith(lang));
    const langIndex2 = LANGUAGES.findIndex(lang => lang2.startsWith(lang));

    if (langIndex1 == langIndex2) return 0;

    // one of the languages missing
    if (langIndex2 == -1) return 1;
    if (langIndex1 == -1) return -1;

    // both in langs
    if (langIndex1 < langIndex2) return 1;
    if (langIndex1 > langIndex2) return -1;
}

function compareExtensionId(id1: string, id2: string) {
    if (id1 == null && id2 != null) return 1;   // null extensionId wins
    if (id1 != null && id2 == null) return -1;
    return 0;
}

function compareProvider(voiceName1: string, voiceName2: string) {
    const value1 = voiceName1.startsWith("IBM") ? 0 : 10;
    const value2 = voiceName2.startsWith("IBM") ? 0 : 10;

    if (value1 > value2) return 1;
    if (value1 < value2) return -1;
    return 0;
}

function compareVoiceName(voiceName1: string, voiceName2: string) {
    if (voiceName1 == voiceName2) return 0;
    if (voiceName1 < voiceName2) return 1;   // alphabetically lower voice wins (A wins over B)
    if (voiceName1 > voiceName2) return -1;
}