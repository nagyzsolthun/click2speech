<template>
    <div>
        <speed-settings-component/>
        <voice-settings-component/>
    </div>
</template>
<script>
import SpeedSettingsComponent from "./content.speech.speed.vue";
import VoiceSettingsComponent from "./content.speech.voice.vue";
export default {
    data() {return {}}
    ,components: { SpeedSettingsComponent, VoiceSettingsComponent }
}
</script>
