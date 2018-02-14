<template>
    <div class="setting hoverable">
        <div>{{'reviewsUrl' | translate}}</div>
        <a :href="reviewsUrl" target="_blank" v-on:click="onClick">{{reviewsUrl}}</a>
    </div>
</template>

<script>
import translate from "./translate.js";

const extensionurl = "https://chrome.google.com/webstore/detail/click2speech/djfpbemmcokhlllnafdmomgecdlicfhj";
function getStoreUrl() {
    return extensionurl + "/reviews";
}

const backgroundCommunicationPort = chrome.runtime.connect();
function sendAnalytics() {
    backgroundCommunicationPort.postMessage({action: "contactInteraction", interaction:"reviews-click"});
}

export default {
    data() { return {reviewsUrl: getStoreUrl()} },
    methods: { onClick: sendAnalytics },
    filters : { translate },
}
</script>
