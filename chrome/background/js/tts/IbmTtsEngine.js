import { buildHttpSpeech } from "./HttpSpeech";

var speech;

function speakListener(utterance, options, sendTtsEvent) {
    var ibmVoiceName = getIbmVoiceName(options.voiceName);
    speech = buildHttpSpeech(utterance, text => buildUrl(text,ibmVoiceName), testLengthLessThan200, options.rate)
        .onStart(() => sendTtsEvent({'type':'start', 'charIndex': 0}))
        .onSentence((charIndex) => sendTtsEvent({'type':'sentence', 'charIndex': charIndex}))
        .onEnd(() => sendTtsEvent({'type': 'end', 'charIndex': utterance.length}))
        .onError(charIndex => sendTtsEvent({'type': 'error', 'charIndex': charIndex}));
    speech.play();
}

function stopListener() {
    if(speech) speech.stop();
}

export { speakListener, stopListener };

var ttsVoiceNameToIbmVoiceName = {
    "IBM Birgit":"de-DE_BirgitVoice",
    "IBM Dieter":"de-DE_DieterVoice",
    "IBM Kate":"en-GB_KateVoice",
    "IBM Allison":"en-US_AllisonVoice",
    "IBM Michael":"en-US_MichaelVoice",
    "IBM Enrique":"es-ES_EnriqueVoice",
    "IBM Laura":"es-ES_LauraVoice",
    "IBM Sofia":"es-US_SofiaVoice",
    "IBM Renee":"fr-FR_ReneeVoice",
    "IBM Francesca":"it-IT_FrancescaVoice",
    "IBM Emi":"ja-JP_EmiVoice",
    "IBM Isabela":"pt-BR_IsabelaVoice"
}
function getIbmVoiceName(ttsVoiceName) {
    return ttsVoiceNameToIbmVoiceName[ttsVoiceName];
}

const TTS_URL_BASE = "https://text-to-speech-demo.mybluemix.net/api/synthesize";
function testLengthLessThan200(text) {
    return text.length < 200;
}

function buildUrl(text,ibmVoiceName) {
    return TTS_URL_BASE + "?text=" + encodeURIComponent(text) + "&voice=" + ibmVoiceName;
}
