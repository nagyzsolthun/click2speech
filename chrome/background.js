/** updates icon to show given volume
 * @param volume numeric value between 0 and 1 that shows volume of playing (0: no sound at all, 1: maximum sound)
 */

var size = 18;
var quarter = size/4;
var ctx = document.getElementById("iconTemplate").getContext("2d");

function drawCircle(c) {
	ctx.fillStyle = c.color;
	
	ctx.beginPath();
	ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI, false);
	if(c.lineWidth) {	//0 lineWidth doesnt seem to be working
		ctx.lineWidth = c.lineWidth;
		ctx.strokeStyle = c.lineColor	|| "black";
		ctx.stroke();
	}

	ctx.closePath();
	ctx.fill();
}

function drawShine(volume) {
	var r = volume * size/2;
	var maxsize = (size/2);
	var minsize = (size/4);
	r = (r>maxsize)?maxsize:r;
	ctx.fillStyle = "rgba(255,255,255,0.5)";
	
	ctx.lineWidth = size/64;
	ctx.strokeStyle = "black"

	ctx.beginPath();
	ctx.arc(size/2, size/2, r, 0, 2*Math.PI, false);
	ctx.closePath();
	
	ctx.stroke();
	ctx.fill();
}

function updateIcon(volume) {
	document.getElementById("iconTemplate").width = size;	//to clear canvas
	
	var r,g,b;
	
	r = 0;
	g = 0;
	b = 127 + Math.round(volume*200);	//200 should be 127
	drawCircle({x:quarter, y:quarter, r:quarter, color:"rgb(+"+r+","+g+","+b+")"});
	
	r = 127 + Math.round(volume*200);
	g = 0;
	b = 0;
	drawCircle({x:3*quarter, y:quarter, r:quarter, color:"rgb(+"+r+","+g+","+b+")"});
	
	r = 127 + Math.round(volume*200);
	g = 0;
	b = 127 + Math.round(volume*200);
	drawCircle({x:3*quarter, y:3*quarter, r:quarter, color:"rgb(+"+r+","+g+","+b+")"});
	
	r = 0;
	g = 127 + Math.round(volume*200);
	b = 0;
	drawCircle({x:quarter, y:3*quarter, r:quarter, color:"rgb(+"+r+","+g+","+b+")"});

	r = 127 + Math.round(volume*200);
	g = 127 + Math.round(volume*200);
	b = 0;
	drawCircle({x:2*quarter, y:2*quarter, r:quarter, color:"rgb(+"+r+","+g+","+b+")", lineWidth:size/64});
	
	//drawShine(volume*2);
	
	chrome.browserAction.setIcon({
		imageData: ctx.getImageData(0, 0, 19, 19)
	});
}

var tts = new GoogleTts();
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(request.hasOwnProperty("textToSpeech")) {
			tts.read(request.textToSpeech, request.languageOfSpeech);
		}
	}
);

setInterval(function(){
	updateIcon(tts.getCurrentVolume());
},10);