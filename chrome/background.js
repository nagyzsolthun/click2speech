var size = 18;
var quarter = size/4;
var ctx = document.getElementById("iconTemplate").getContext("2d");

/** draws a circle with given parameters
 * @param c.color = color of circle
 * 
 * @param c.x x coordinate of middle of circle
 * @param c.y y coordinate of middle of circle
 * @param c.r radius of circle
 * 
 * @c.borderWidth width of border
 * @c.borderColor color of bordder
 */
function drawCircle(c) {
	ctx.fillStyle = c.color;
	
	ctx.beginPath();
	ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI, false);
	if(c.borderWidth) {	//0 lineWidth doesnt seem to be working
		ctx.lineWidth = c.borderWidth;
		ctx.strokeStyle = c.borderColor || "black";
		ctx.stroke();
	}

	ctx.closePath();
	ctx.fill();
}

/** creats a html compatible color string from given parameters. ig a component is not set, it defaults to 0
 * @param c.r red [0-1]
 * @param c.g green [0-1]
 * @param c.b blue [0-1]
 * @param c.a aplha [0-1] where 0 is totally transparent
 */
function htmlColor(c) {
	var r = c.r? Math.round(c.r*255): 0;
	var g = c.g? Math.round(c.g*255): 0;
	var b = c.b? Math.round(c.b*255): 0;
	var a = c.a?c.a:1;
	return "rgba(+"+r+","+g+","+b+","+a+")";
}

/** updates icon to show given volume
 * @param volume [0-1] volume*/
function updateIcon(volume) {
	document.getElementById("iconTemplate").width = size;	//to clear canvas
	
	drawCircle({color:htmlColor({b:0.5+volume/2}),				x:quarter,y:quarter,r:quarter});
	drawCircle({color:htmlColor({r:0.5+volume/2}),				x:3*quarter,y:quarter,r:quarter});
	drawCircle({color:htmlColor({r:0.5+volume/2, b:0.5+volume/2}),	x:3*quarter,y:3*quarter,r:quarter});
	drawCircle({color:htmlColor({g:0.5+volume/2}),				x:quarter,y:3*quarter,r:quarter});

	//center
	drawCircle({color:htmlColor({r:1,g:1}),						x:2*quarter,y:2*quarter,r:quarter,borderWidth: size/64});
	
	var shineRadius;
	if(volume>1) shineRadius = quarter*2;	//max
	if(volume<0.5) shineRadius = quarter;	//min
	if(! shineRadius) shineRadius = quarter*2*volume;
	
	drawCircle({color:htmlColor({r:1,g:1,b:1,a:0.5}),			x:2*quarter,y:2*quarter,r:shineRadius,borderWidth: size/64});
	
	chrome.browserAction.setIcon({
		imageData: ctx.getImageData(0, 0, 19, 19)
	});
}

//this is where magic happens when a message is received
var tts = new GoogleTts();
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(request.hasOwnProperty("textToSpeech")) {
			tts.read(request.textToSpeech, request.languageOfSpeech);
		}
	}
);

//icon is redrawn when volume of speech changes
var previousVolume = 0;
setInterval(function(){
	var currentVolume = tts.getCurrentVolume()
	if(previousVolume != currentVolume) {
		updateIcon(tts.getCurrentVolume());
	}
	previousVolume = currentVolume;
},10);