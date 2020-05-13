import { useEffect, useState } from "react";

export default function() {
  useEffect(init, []); // empty array means executing only once

  const [voices, setVoices] = useState<{name: string, lan: string}[]>();

  function init() {
    new Promise<chrome.tts.TtsVoice[]>(resolve => chrome.tts.getVoices(resolve))
      .then(chromeVoices => Promise.resolve(chromeVoices))
      .then(chromeVoices => chromeVoices.filter(voice => voice.lang)) // some voices may not have lang set
      .then(chromeVoices => chromeVoices.sort(compareVoices).reverse())
      .then(chromeVoices => chromeVoices.map(voice => ({name: voice.voiceName || "?", lan: voice.lang || ""}) ))
      .then(voices => setVoices(voices))
  }

  return voices;
}

const LANGUAGES = ["en-US", "en-GB", "en", "de", "fr", "es-ES", "es-US"]

function compareVoices(voice1: chrome.tts.TtsVoice, voice2: chrome.tts.TtsVoice) {

  var result = compareExtensionId(voice1.extensionId, voice2.extensionId);
  result = result ? result : compareProvider(voice1.voiceName, voice2.voiceName);
  result = result ? result : compareLangs(voice1.lang, voice2.lang);
  result = result ? result : compareVoiceName(voice1.voiceName, voice2.voiceName);
  return result;
}

function compareLangs(lang1?: string, lang2?: string) {
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

function compareExtensionId(id1?: string, id2?: string) {
  if (id1 === undefined && id2 !== undefined) return 1;   // undefined extensionId wins
  if (id1 !== undefined && id2 === undefined) return -1;
  return 0;
}

function compareProvider(voiceName1?: string, voiceName2?: string) {
const value1 = voiceName1 && voiceName1.startsWith("IBM") ? 0 : 10;
const value2 = voiceName2 && voiceName2.startsWith("IBM") ? 0 : 10;

if (value1 > value2) return 1;
if (value1 < value2) return -1;
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