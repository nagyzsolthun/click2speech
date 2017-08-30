var voiceNameToRejectTime = {};

function getVoiceName(text, pageLanguage) {
	return new Promise( (resolve,reject) => {
		var settingsPromise = new Promise(resolve => chrome.storage.local.get(null, resolve));
		var voicesPromise = new Promise(resolve => chrome.tts.getVoices(resolve));
		var lanPromise = calcLanPromise(text,pageLanguage);
		Promise.all([settingsPromise,voicesPromise,lanPromise]).then( ([settings,voices,lan]) => {
			var voicesMatchingLan = voices.filter(voice => voice.lang.startsWith(lan));	// tss lanuage is given like en-US, lan is like en
			if(voicesMatchingLan.some(voice => voice.voiceName == settings.preferredVoice)) {
				resolve(settings.preferredVoice);
				return;
			}
			var firstVoice = voicesMatchingLan[0];
			if(!firstVoice) {
				reject("invalid language: ''" + lan + "''");
				return;
			}
			resolve(firstVoice.voiceName);
		});
	});
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

function calcLanPromise(text, pageLanguage) {
	return new Promise(resolve => {
		chrome.i18n.detectLanguage(text, result => {
			if(!result.isReliable) resolve(pageLanguage || navigator.language);
			else resolve(result.languages.reduce(getHigherPercentage).language);
		});
	});
}

function getHigherPercentage(a,b) {
	if(!a) return b;
	if(!b) return a;
	return a.percentage > b.percentage ? a : b;
}

export { getVoiceName, getDefaultVoiceName, rejectVoice, getRejectedVoices }
