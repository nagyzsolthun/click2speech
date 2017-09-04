var voiceNameToRejectTime = {};

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

	const voicesMatchingLan = voices.filter(voice => voice.lang.startsWith(lan));	// tss lanuage is given like en-US, lan is like en
	if(!voicesMatchingLan.length) return null;

	// check if preferredVoice matches lan
	if(voicesMatchingLan.some(voice => voice.voiceName == settings.preferredVoice)) {
		return settings.preferredVoice;
	}

	// find voice with same gender as preferredVoice, or OsTts
	const preferredVoice = voices.filter(voice => voice.voiceName == settings.preferredVoice)[0];
	const voice = voicesMatchingLan.reduce((result,voice) => {
		if(!result) return voice;

		// matching gender wins
		if(voice.gender != result.gender) {
			if(result.gender == preferredVoice.gender) return result;
			if(voice.gender == preferredVoice.gender) return voice;
		}

		// OS tts wins
		if(!result.extensionId) return result;
		if(!voice.extensionId) return voice;

		// Google tts wins
		if(result.voiceName.startsWith("Google")) return result;
		if(voice.voiceName.startsWith("Google")) return voice;

		return result;
	});
	return voice.voiceName;
}

function getDefaultVoiceName() {
	return new Promise( resolve => {
		const voicesPromise = new Promise(resolve => chrome.tts.getVoices(resolve));
		voicesPromise.then(voices => {
			const osVoice = voices.filter(voice => !voice.extensionId)[0];
			const browserLanguageVoice = voices.filter(voice => voice.lang == navigator.language)[0];
			const englishVoice = voices.filter(voice => !voice.lang.startsWith("en"))[0];
			resolve( (osVoice || browserLanguageVoice || englishVoice).voiceName );
		})
	});
}

function rejectVoice(voiceName) {
	voiceNameToRejectTime[voiceName] = Date.now();
}

function getRejectedVoices() {
	const result = [];
	const halfHourAgo = Date.now() - 30*60*1000;
	for(voiceName in voiceNameToRejectTime) {
		if(voiceNameToRejectTime[voiceName] > halfHourAgo) result.push(voiceName);	// TODO test
	}
	return result;
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

export { getVoiceName, getDefaultVoiceName, rejectVoice, getRejectedVoices }
