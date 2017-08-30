<template>
    <div class="setting hoverable" ng-class="{unavailable: !isPropertyOfSelectedTts('speed')}">
    	<div>Speed</div>
    	<input class="numberInput" type="number" :min="min" :max="max" :step="step" v-model="value" />
    	<input class="rangeInput" type="range" :min="min" :max="max" :step="step" v-model="value" />
    </div>
</template>

<style>
.numberInput {
	width: 2em;
	font-size: 30px;
	-webkit-transition: opacity .2s linear;
}
.rangeInput {
	height:64px;	/*big to catch the thumb easily */
	width: 100%;
	margin:-16px 0;	/* smaller vertical space usage*/
	-webkit-appearance: none;
	background-color:rgba(0,0,0,0);
}

.rangeInput:focus {outline: none;}	/* to hide rectangle when in focus */

.rangeInput::-webkit-slider-runnable-track {
	width: 100%;
	height: 3px;
	background-color: #888;
	vertical-align: middle;
}

.rangeInput::-webkit-slider-thumb {
	-webkit-appearance: none;
	background-image: url('img/sliderThumb.svg');
	height: 32px;
	width: 32px;
	margin-top:-16px;	/*move up to the middle */
	-webkit-transition: all .2s linear;
}
.rangeInput:hover::-webkit-slider-thumb {
	background-image: url('img/sliderThumbSelected.svg');
}

.setting.unavailable > .numberInput {
	opacity: 0;
	pointer-events: none;
}
.setting.unavailable > .rangeInput {pointer-events: none;}
.setting.unavailable > .rangeInput::-webkit-slider-runnable-track {background-color: #bbb;}
.setting.unavailable > .rangeInput::-webkit-slider-thumb {opacity: 0;}
</style>

<script>
const speedOptions = {
    min: 0.5
    ,max: 4
    ,step: 0.1
    ,value: null
};

chrome.storage.local.get(null, settings => speedOptions.value = settings.speed);

function updateSetting(value) {
    const speed = parseFloat(value);
    chrome.storage.local.set({ speed })
}

export default {
    data() { return speedOptions }
    ,watch: { value: updateSetting }
}
</script>
