<template>
    <div class="setting hoverable">
    	<div>{{"selectionOptions" | translate}}</div>
    	<ul class="choiceList selectionList">
    		<li v-for="option in selectionOptions" v-bind:class="{selected: option.selected}" v-on:click="onSelectionOptionClick(option)">
    			<span>{{option.name | translate}}</span>
    		</li>
    	</ul>
    </div>
</template>

<style>
.selectionList > :before			{background-image: url('./img/check.svg');}
.selectionList > .selected:before	{background-image: url('./img/checkSelected.svg');}
</style>

<script>

import translate from "./translate.js";

const selectionOptions = [
    {name:"hoverSelect", selected:false}
    ,{name:"arrowSelect", selected:false}
    ,{name:"browserSelect", selected:false}
];
chrome.storage.local.get(null, settings => {
    selectionOptions.forEach(option => option.selected = settings[option.name])
});

function selectOption(option) {
    var optionToUpdate = selectionOptions.filter(o => o.name == option.name)[0];
    optionToUpdate.selected = !optionToUpdate.selected;
    chrome.storage.local.set({[option.name]: option.selected});
}

export default {
    data() { return { selectionOptions } }
    ,methods: { onSelectionOptionClick: selectOption }
    ,filters : { translate }
}
</script>
