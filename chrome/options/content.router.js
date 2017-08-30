import Vue from 'vue';
import VueRouter from 'vue-router'
import GeneralSettingsComponent from './content.general.vue';
import SpeechSettingsComponent from './content.speech.vue';
import ContactComponent from './content.contact.vue';

// https://forum-archive.vuejs.org/topic/3019/vue-router-with-webpack-components-build/6
Vue.use(VueRouter);

const routes = [
    {path: "/", redirect: "/general"}
    ,{path: "/general", component: GeneralSettingsComponent}
    ,{path: "/speech", component: SpeechSettingsComponent}
    ,{path: "/contact", component: ContactComponent}
];
export default new VueRouter({routes});
