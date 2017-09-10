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
	// no language detected, just return preferred voice
	if(!lan) return settings.preferredVoice;

	const voicesMatchingLan = voices
		.filter(voice => isEnabled(voice))
		.filter(voice => voice.lang.startsWith(lan));	// tss lanuage is given like en-US, lan is like en
	if(!voicesMatchingLan.length) return null;

	// check if preferredVoice matches lan
	if(voicesMatchingLan.some(voice => voice.voiceName == settings.preferredVoice)) {
		return settings.preferredVoice;
	}

	// find voice with same gender as preferredVoice, or OsTts
	const preferredVoice = voices.filter(voice => voice.voiceName == settings.preferredVoice)[0];
	const voice = voicesMatchingLan.reduce((voice1,voice2) => {
		// matching gender wins
		if(voice1.gender != voice2.gender) {
			if(voice1.gender == preferredVoice.gender) return voice1;
			if(voice2.gender == preferredVoice.gender) return voice2;
		}

		// OS tts wins
		if(!voice1.extensionId) return voice1;
		if(!voice2.extensionId) return voice2;

		// Google tts wins
		if(voice1.voiceName.startsWith("Google")) return voice1;
		if(voice2.voiceName.startsWith("Google")) return voice2;

		// genders are same, no OS voice, no Google voice
		return voice1;
	});
	return voice.voiceName;
}

function getDefaultVoiceName() {
	return new Promise( resolve => {
		const voicesPromise = new Promise(resolve => chrome.tts.getVoices(resolve));
		voicesPromise.then(voices => {
			var voice = voices.reduce((voice1,voice2) => {
				// dialect wins
				if(voice1.lang != voice2.lang) {
					if(navigator.language == voice1.lang) return voice1;
					if(navigator.language == voice2.lang) return voice2;
				}

				// language wins
				const lan1 = voice1.lang.split("-")[0];
				const lan2 = voice2.lang.split("-")[0];
				if(lan1 != lan2) {
					if(navigator.language.startsWith(lan1)) return voice1;
					if(navigator.language.startsWith(lan2)) return voice2;
				}

				// OS tts wins
				if(!voice1.extensionId) return voice1;
				if(!voice2.extensionId) return voice2;

				return voice1;
			});
			resolve(voice.voiceName);
		})
	});
}

var disabledVoices = [];
function updateDisabledVoices(voices) {
	disabledVoices = voices;
}

function isEnabled(voice) {
	return !disabledVoices.some(disabledVoice => disabledVoice == voice.voiceName);
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
