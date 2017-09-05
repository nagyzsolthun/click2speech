<template>
    <div class="setting hoverable">
    	<div>{{'ttsOptions' | translate}}</div>
    	<ul class="choiceList voiceList">
    		<li	v-for="voice in voices"
    			v-bind:class="{selected: voice.selected}"
    			v-on:click="onVoiceClick(voice)">
                <span>
        			<span class="voice-name">{{voice.name}}</span>
                    <span class="voice-lan">{{voice.lan}}</span>
                </span>
    		</li>
    	</ul>
    </div>
</template>

<style>
.voice-name {font-size:25px;}
.voice-lan {font-size:25px;color:DarkGrey;-webkit-transition:inherit;}

.voiceList > li:hover > span > .voice-lan {color:black;}

.voiceList > li:before						{background-image: url('./img/radio.svg');}
.voiceList > li.selected:before				{background-image: url('./img/radioSelected.svg');}
.voiceList > li.selected.loading:before		{background-image: url('./img/radioSelectedLoading.svg');}
.voiceList > li.selected.unavailable:before	{background-image: url('./img/radioSelectedUnavailable.svg');opacity: 1;}
</style>

<script>
import translate from "./translate.js";
import compareVoices from "./compareVoices.js"

const voices = [];

const settingsPromise = new Promise(resolve => chrome.storage.local.get(null, resolve));
const chromeVoicesPromise = new Promise(resolve => chrome.tts.getVoices(resolve));
Promise.all([settingsPromise,chromeVoicesPromise]).then( ([settings,chromeVoices]) => {
    chromeVoices.sort(compareVoices);
    chromeVoices.reverse();
    chromeVoices.forEach(voice => voices.push({
        name:voice.voiceName
        ,lan:voice.lang
        ,selected: settings.preferredVoice == voice.voiceName
    }));
});

function selectVoice(voice) {
    voices.forEach(voice => voice.selected = false);
    var voiceToUpdate = voices.filter(v => v.name == voice.name)[0];
    voiceToUpdate.selected = !voiceToUpdate.selected;

    chrome.storage.local.set({preferredVoice: voice.name});
}

export default {
    data() { return {voices} }
    ,methods: { onVoiceClick: selectVoice }
    ,filters : { translate }
}
</script>
