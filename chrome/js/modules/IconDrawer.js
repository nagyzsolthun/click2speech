/**draws the icon of WebReader - the look depends on the volume of playing and the status (on/off) */
define(function() {
	var size = 18;	//TODO from setter
	var quarter = size/4;
	var ctx;
	var canvas;

	/** draws a filled circle with given parameters to the middle of the canvas
	* @param c.color color
	* @param c.r radius
	*/
	function drawBall(c) {
		ctx.fillStyle = c.color;
		ctx.beginPath();
		ctx.arc(2*quarter, 2*quarter, c.r, 0, 2*Math.PI);
		ctx.fill();
	}
	
	/** draws a non-filled circle with given parameters to the middle of the canvas
	* @param c.color color
	* @param c.width width
	* @param c.r radius
	*/
	function drawRing(c) {
		ctx.lineWidth = c.width;
		ctx.strokeStyle = c.color;
		ctx.beginPath();
		ctx.arc(2*quarter, 2*quarter, c.r, 0, 2*Math.PI);
		ctx.stroke();
	}

	/** @return a html compatible color string from given parameters
	* @param c.r red [0-1] (default is 0)
	* @param c.g green [0-1] (default is 0)
	* @param c.b blue [0-1] (default is 0)
	* @param c.a aplha [0-1] where 0 is totally transparent (default is 1)
	*/
	function htmlColor(c) {
		var r = c.r? Math.round(c.r*255): 0;
		var g = c.g? Math.round(c.g*255): 0;
		var b = c.b? Math.round(c.b*255): 0;
		var a = c.a?c.a:1;
		return "rgba(+"+r+","+g+","+b+","+a+")";
	}
	
	//================================================= public =================================================
	/** the object to be returned */
	var drawer = {};
	
	drawer.setCanvas = function(cnv) {
		canvas = cnv;
		ctx = canvas.getContext("2d");
	}

	/** draws icon to show given volume
	* @param volume [0-1] volume*/
	drawer.drawTurnedOn = function(volume) {
		canvas.width = size;	//to clear canvas
		drawBall({color:htmlColor({g:1}),r:quarter*0.9});			//green circle in center
		drawRing({color:"black", r:quarter*0.9, width:size/16});	//black ring around center
		drawRing({color:"green", r:2*quarter*0.9, width:size/16});	//green outer ring
	
		//the circle showing the current volume of playing
		if(volume < 0.1) return;
		if(volume > 1) volume = 1;
		var shineRadius = quarter + quarter*volume;
		drawBall({color:htmlColor({g:1,a:0.5}),r:shineRadius});
	}
	
	drawer.drawTurnedOff = function() {
		canvas.width = size;	//to clear canvas
		drawBall({color:"grey",r:quarter*0.9});						//circle in center
		drawRing({color:"black", r:quarter*0.9, width:size/16});	//black ring around center
		drawRing({color:"black",r:2*quarter*0.9,width: size/16});	//black outer ring
	}
	
	return drawer;
});