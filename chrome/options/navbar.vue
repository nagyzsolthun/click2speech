<template>
    <ul class="nav-bar">
    	<li v-bind:class="{active:isCurrentRoute('/general')}" v-on:click="routeTo('general')">
    		<span>{{'generalOptionsPage' | translate}}</span>
    	</li><li v-bind:class="{active:isCurrentRoute('/speech')}" v-on:click="routeTo('speech')">   <!-- 2 lis in the same line to remove space between-->
    		<span>{{'speechOptionsPage' | translate}}</span>
    	</li><li id="contactNavButton"  v-bind:class="{active:isCurrentRoute('/contact')}" v-on:click="routeTo('contact')">
    		<span>{{'contactPage' | translate}}</span>
    	</li>
    </ul>
</template>

<style>
.nav-bar {
	margin: 0;
    padding: 0;
	background-color:#333;
}
.nav-bar li {
	display: inline-block;
	list-style: none;
	padding: 1.5em;
	margin:0;
	-webkit-transition: background-color .1s linear;
}
.nav-bar span {
	font-size: 2em;
	text-decoration: none;
	color: white;
}
.nav-bar li.active {background-color:#292;}
.nav-bar li:hover {background-color:#4f4;}
#contactNavButton {float:right;}
</style>

<script>
import router from "./content.router.js";
import translate from "./translate.js";
export default {
    data() {
        return {};
    }
    ,methods: {
        isCurrentRoute: function(page) {
            return this.$route.path == page;
        }
        ,routeTo: function(page) {
            router.push(page);
            console.log(this.$route.path);
        }
    }
    ,filters : { translate }
}
</script>
