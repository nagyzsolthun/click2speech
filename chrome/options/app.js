import Vue from 'vue';
import MainComponent from "./main.vue";
import router from "./content.router.js";

// create app element, so there is no need for custom html template in webpack
const appElement = document.createElement("div");
appElement.setAttribute("id","app");
document.body.appendChild(appElement);

new Vue({
    el: '#app',
    router: router,
    render: r => r(MainComponent),
});
