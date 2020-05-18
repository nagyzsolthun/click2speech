async function getVoice(text, disabledVoices) {
    const settingsPromise = new Promise<any>(resolve => chrome.storage.local.get(null, resolve));
    const lanDetectPromise = calcLanPromise(text);
    const voicesPromise = getSortedVoices();
    const [settings, lanDetect, voices] = await Promise.all([settingsPromise, lanDetectPromise, voicesPromise]);

    const enabledVoices = voices.filter(voice => !disabledVoices.includes(voice.name));
    const voice = selectVoice(enabledVoices, settings.preferredVoice, lanDetect);
    return Promise.resolve(voice);
}

async function getDefaultVoiceName() {
    const voices = await getSortedVoices();
    return voices[0]?.name || "";
}

async function getSortedVoices() {
    const voices = await getVoices();
    return voices.sort(compareVoices).reverse();
  }

async function calcLanPromise(text) {
    const result = await new Promise<chrome.i18n.LanguageDetectionResult>(resolve => chrome.i18n.detectLanguage(text, resolve))
    return result.isReliable && result.languages.reduce(higherPercentage).language;
}

function selectVoice(enabledVoices: SpeechSynthesisVoice[], preferredVoiceName: string, lanDetect: string, ) {
    const preferredVoice = enabledVoices.find(voice => voice.name === preferredVoiceName);
    if(!lanDetect) {
        return preferredVoice || enabledVoices[0];
    }
    if(matchingLanguage(preferredVoice, lanDetect)) {
        return preferredVoice;
    }
    return enabledVoices.find(voice => matchingLanguage(voice, lanDetect));
}

function getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise<SpeechSynthesisVoice[]>(resolve => {
        const voices = speechSynthesis.getVoices();
        if(voices.length) {
            resolve(voices);
            return;
        }

        // wait if voices appear
        speechSynthesis.addEventListener("voiceschanged", resolveVocies);
        function resolveVocies() {
            speechSynthesis.removeEventListener("voiceschanged", resolveVocies);
            resolve(speechSynthesis.getVoices());
            clearTimeout(timeout);
        };

        // add timeout
        const timeout = setTimeout(() => {
            speechSynthesis.removeEventListener("voiceschanged", resolveVocies);
            resolve([]);
        }, 1000);
    });
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

const LANGUAGES = ["en-US", "en-GB", "en", "de", "fr", "es-ES", "es-US"]

function compareVoices(voice1: SpeechSynthesisVoice, voice2: SpeechSynthesisVoice) {
  var result = compareFlag(voice1.localService, voice2.localService);
  result = result ? result : compareLang(voice1.lang, voice2.lang);
  result = result ? result : compareVoiceName(voice1.name, voice2.name);
  return result;
}

function compareFlag(flag1?: boolean, flag2?: boolean) {
  if (flag1 && !flag2) return 1;  // true wins
  if (!flag1 && flag2) return -1;
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