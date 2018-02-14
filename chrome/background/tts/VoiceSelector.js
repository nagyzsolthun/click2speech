function getVoiceName(text) {
    return new Promise( (resolve,reject) => {
        var settingsPromise = new Promise(resolve => chrome.storage.local.get(null, resolve));
        var voicesPromise = new Promise(resolve => chrome.tts.getVoices(resolve));
        var lanPromise = calcLanPromise(text);
        Promise.all([settingsPromise,voicesPromise,lanPromise]).then( ([settings,voices,lan]) => {
            const voiceName = calcVoiceName(settings,voices,lan);
            if(voiceName) resolve(voiceName);
            else reject();
        });
    });
}

function calcVoiceName(settings,voices,lan) {
    const preferredVoice = voices.filter(voice => voice.voiceName == settings.preferredVoice)[0];
    const voice = voices.reduce((voice1,voice2) => {
        const value1 = calcSpeechVoiceValue(voice1,lan,preferredVoice);
        const value2 = calcSpeechVoiceValue(voice2,lan,preferredVoice);
        if(value1 > value2) return voice1;
        if(value1 < value2) return voice2;
        return value1 ? voice1 : null;    // value2 is also 0 is value1 is
    });
    return voice ? voice.voiceName : null;
}

function getDefaultVoiceName() {
    return new Promise( resolve => {
        const voicesPromise = new Promise(resolve => chrome.tts.getVoices(resolve));
        voicesPromise.then(voices => {
            var voice = voices.reduce((voice1,voice2) => {
                const value1 = calcDefaultVoiceValue(voice1,navigator.language);
                const value2 = calcDefaultVoiceValue(voice2,navigator.language);
                return (value1 < value2) ? voice2 : voice1;
            });
            resolve(voice.voiceName);
        })
    });
}

function calcSpeechVoiceValue(voice, lan, preferredVoice) {
    if(!voice) return 0;
    if(isDisabled(voice)) return 0;
    if(lan && !voice.lang.startsWith(lan)) return 0;    // if lan provided, voice must match it

    const matchingPreferredVoice = voice == preferredVoice
    const matchingPreferredGender = voice.gender == (preferredVoice ? preferredVoice.gender : null);
    const osVoice = !voice.extensionId;
    const noIbmVoice = !voice.voiceName.startsWith("IBM");
    const matchingPreferredLan = voice.lang.split("-")[0] == (preferredVoice ? preferredVoice.lang.split("-")[0] : navigator.language.split("-")[0]);

    var value = 1;    // already worth more than rejected voices
    if(matchingPreferredVoice)    value += 100000;
    if(matchingPreferredGender)    value += 10000;
    if(osVoice)                    value += 1000;
    if(noIbmVoice)                value += 100;
    if(matchingPreferredLan)    value += 10;    // this is important when no lan is provided
    return value;
}

// return the value of voice as default
function calcDefaultVoiceValue(voice, lan) {
    const matchingLanguage = voice.lang.split("-")[0] == lan.split("-")[0];    // lan is in form en-US
    const osVoice = !voice.extensionId;
    const noIbmVoice = !voice.voiceName.startsWith("IBM");
    const femaleVoice = voice.gender == "female";
    const matchingDialect = voice.lang == lan;
    const usEnglishVoice = voice.lang == "en-US";

    var value = 0;
    if(matchingLanguage)    value += 100000;
    if(osVoice)                value += 10000;
    if(noIbmVoice)            value += 1000;
    if(femaleVoice)            value += 100;
    if(matchingDialect)        value += 10;
    if(usEnglishVoice)        value += 1;
    return value;
}

var disabledVoices = [];
function updateDisabledVoices(voices) {
    disabledVoices = voices;
}

function isDisabled(voice) {
    return disabledVoices.some(disabledVoice => disabledVoice == voice.voiceName);
}

function calcLanPromise(text) {
    return new Promise(resolve =>
        chrome.i18n.detectLanguage(text, result =>
            resolve(result.isReliable ? result.languages.reduce(getHigherPercentage).language : null)
    ));
}

function getHigherPercentage(a,b) {
    if(!a) return b;
    if(!b) return a;
    return a.percentage > b.percentage ? a : b;
}

export { getVoiceName, getDefaultVoiceName, updateDisabledVoices }
