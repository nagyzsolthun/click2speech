function getVoice(text, disabledVoices) {
    const settingsPromise = new Promise(resolve => chrome.storage.local.get(null, resolve));
    const langDetectPromise = calcLanPromise(text);
    return Promise.all([settingsPromise,langDetectPromise]).then(values => {
        const settings = values[0] as any;
        const lanDetect = values[1] as string;
        const voice = selectVoice(lanDetect, settings.preferredVoice, disabledVoices);
        return voice ? Promise.resolve(voice) : Promise.reject("no matching voice for " + lanDetect);
    });
}

function getDefaultVoiceName() {
    const timeoutPromise = new Promise((_, reject) => setTimeout(reject, 5000));
    const defaultVoicePromise = new Promise(resolve => {
        const voice = getSortedVoices()[0];
        if(voice) {
            resolve(voice.name);
            return;
        }
        speechSynthesis.addEventListener("voiceschanged", () => {
            const voice = getSortedVoices()[0];
            voice && resolve(voice.name);
        }, {once: true});
    });
    return Promise.race([defaultVoicePromise, timeoutPromise]);
}

function calcLanPromise(text) {
    return new Promise<chrome.i18n.LanguageDetectionResult>(resolve => chrome.i18n.detectLanguage(text, resolve))
        .then(result => result.isReliable && result.languages.reduce(higherPercentage).language);
}

function selectVoice(lanDetect: string, preferredVoiceName: string, disabledVoices: string[]) {
    const voices = getSortedVoices().filter(voice => !disabledVoices.includes(voice.name));
    const preferredVoice = voices.find(voice => voice.name === preferredVoiceName);
    if(!lanDetect) {
        return preferredVoice || voices[0];
    }
    if(matchingLanguage(preferredVoice, lanDetect)) {
        return preferredVoice;
    }
    return voices.find(voice => matchingLanguage(voice, lanDetect));
}

function higherPercentage(a,b) {
    if(!a) return b;
    if(!b) return a;
    return a.percentage > b.percentage ? a : b;
}

function matchingLanguage(voice: SpeechSynthesisVoice, lan: string) {
    // voice.lang is in form en-US
    // lan is usually in form en, but we are future proof here
    return voice && voice.lang.split("-")[0] == lan.split("-")[0];
}

// ============================================== new stuff ==============================================
function getSortedVoices() {
  return speechSynthesis.getVoices().sort(compareVoices).reverse();
}

const LANGUAGES = ["en-US", "en-GB", "en", "de", "fr", "es-ES", "es-US"]

function compareVoices(voice1: SpeechSynthesisVoice, voice2: SpeechSynthesisVoice) {
  var result = compareFlag(voice1.localService, voice2.localService);
  result = result ? result : compareProvider(voice1.name, voice2.name);
  result = result ? result : compareLang(voice1.lang, voice2.lang);
  result = result ? result : compareVoiceName(voice1.name, voice2.name);
  return result;
}

function compareFlag(flag1?: boolean, flag2?: boolean) {
  if (flag1 && !flag2) return 1;  // true wins
  if (!flag1 && flag2) return -1;
  return 0;
}

function compareProvider(voiceName1?: string, voiceName2?: string) {
    const provider1 = voiceName1 ? voiceName1.split(" ")[0] : null;
    const provider2 = voiceName2 ? voiceName2.split(" ")[0] : null;
    if (provider1 === provider2) return 0;
    if (!provider1) return 1;
    if (!provider2) return -1;
    if (provider1 < provider2) return 1;   // alphabetically lower voice wins (A wins over B)
    if (provider1 > provider2) return -1;
    return 0;
  }

function compareLang(lang1?: string, lang2?: string) {
  const langIndex1 = LANGUAGES.findIndex(lang => lang1 && lang1.startsWith(lang));
  const langIndex2 = LANGUAGES.findIndex(lang => lang2 && lang2.startsWith(lang));

  if (langIndex1 === langIndex2) return 0;

  // one of the languages missing
  if (langIndex2 === -1) return 1;
  if (langIndex1 === -1) return -1;

  // both in langs
  if (langIndex1 < langIndex2) return 1;
  if (langIndex1 > langIndex2) return -1;

  return 0;
}

function compareVoiceName(voiceName1?: string, voiceName2?: string) {
  if (voiceName1 === voiceName2) return 0;
  if (!voiceName1) return 1;
  if (!voiceName2) return -1;
  if (voiceName1 < voiceName2) return 1;   // alphabetically lower voice wins (A wins over B)
  if (voiceName1 > voiceName2) return -1;
  return 0;
}

export { getVoice, getDefaultVoiceName, getSortedVoices }