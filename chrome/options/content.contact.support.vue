<template>
    <div class="setting hoverable">
        <div>{{'support' | translate}}</div>
        <a :href="href" v-on:click="onClink">{{email}}</a>
    </div>
</template>

<script>
import translate from "./translate.js";

function getEmail() {
	return "nagydotzsoltdothunatgmaildotcom".replace(/dot/g,".").replace(/at/g,"@");	// obfuscate against spammers
}
function getEmailHref() {
    return "mailto:" + getEmail() + "?subject=click2speech question";
}

const backgroundCommunicationPort = chrome.runtime.connect();
function sendAnalytics() {
    backgroundCommunicationPort.postMessage({action: "contactInteraction", interaction:"support-click"});
}

export default {
    data() { return {email: getEmail(), href:getEmailHref()} },
    methods: { onClink: sendAnalytics },
    filters : { translate }
}
</script>
