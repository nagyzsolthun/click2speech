/**draws the icon of WebReader - the look depends on the volume of playing and the status (on/off) */
define(function() {
	var size = 18;	//TODO from setter
	var quarter = size/4;

	var ctx;
	var canvas;
	
	var renderedIcon;	//stores the last drawn icon
	var animationId;	//the id of the last started animation
	
	var onRenderFinished = function() {};	//execued whenever the icon is redrawn

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
	
	/** @return a filled rgba object - or null if given o is null
	 * @param o.r the red component of result - defaults to 0
	 * @param o.g the green component of result - defaults to 0
	 * @param o.b the blue component of result - defaults to 0
	 * @param o.a the alpha component of result - defaults to 1
	 */
	function rgba(o) {
		if(!o) return null;
		var result = {};
		result.r = o.r || 0;
		result.g = o.g || 0;
		result.b = o.b || 0;
		result.a = (o.a!=null)?o.a:1;	//if o.a is zero, we want to keep it as is
		return result;
	}

	/** @return a html compatible color string from given parameters
	 * @param o rgba object
	*/
	function htmlColor(o) {
		if(!o) return "rgba(0,0,0,0)";

		var r = Math.round(o.r*255);
		var g = Math.round(o.g*255);
		var b = Math.round(o.b*255);
		var a = o.a;
		return "rgba("+r+","+g+","+b+","+a+")";
	}
	
	/** draws the icon with given colors
	 * @param icon.innerFill: the fill color of the circle inside as rgba object
	 * @param icon.innerRing: the color of the inenr ring as rgba object
	 * @param icon.outerFill: the fill color of the circle outside as rgba object
	 * @param icon.outerRing: the color of the outer ring as rgba object
	 */
	function render(icon) {
		var transparent = "rgba(0,0,0,0)";
		
		canvas.width = size;	//to clear canvas
		drawBall({color:htmlColor(icon.outerFill) || transparent,r:quarter*2*0.9});
		drawRing({color:htmlColor(icon.outerRing) || transparent, r:quarter*2*0.9, width:size/16});
		
		drawBall({color:htmlColor(icon.innerFill) || transparent,r:quarter*0.9});
		drawRing({color:htmlColor(icon.innerRing) || transparent, r:quarter*0.9, width:size/16});
		
		renderedIcon = icon;
		onRenderFinished();
	}
	
	/** @return the mix of given 2 colors with given weights
	 * @param c1 the first color as rgba object
	 * @param c2 the second color as rgba object
	 * @param s the state of the transition: 0 is the beginning, 1 is the end*/
	function mix(c1, c2, s) {
		var result = {};
		if(!c1 && !c2) return;
		c1 = c1 || {r:c2.r,g:c2.g,b:c2.b,a:0};	//null source is transparent target
		c2 = c2 || {r:c1.r,g:c1.g,b:c1.b,a:0};	//null target is transparent source

		result.r = c1.r*(1-s) + c2.r*s;
		result.g = c1.g*(1-s) + c2.g*s;
		result.b = c1.b*(1-s) + c2.b*s;
		result.a = c1.a*(1-s) + c2.a*s;
		return result;
	}
	
	/** animates a transition between the current icon and the one given in c
	 * @param c.length the length of the animation
	 * @param c.fps frames per second (defaults to 100)
	 * @param c.icon the icon to draw
	 */
	function setIcon(c) {
		if(animationId) window.clearInterval(animationId);
		if(!c.length || !renderedIcon) {
			render(c.icon);
			return;
		}
		
		var fps = c.fps || 100;
		var from = renderedIcon;	//source of the animation

		var allFrames = c.length*fps;
		var currentFrame = 0;
		animationId = window.setInterval(function() {
			if(++currentFrame > allFrames) {
				window.clearInterval(animationId);
				return;
			}
			render({
				innerFill:mix(from.innerFill, c.icon.innerFill, currentFrame/allFrames)
				,innerRing:mix(from.innerRing, c.icon.innerRing, currentFrame/allFrames)
				,outerFill:mix(from.outerFill, c.icon.outerFill, currentFrame/allFrames)
				,outerRing:mix(from.outerRing, c.icon.outerRing, currentFrame/allFrames)
			});
		}, 1000/fps);
	}
	
	/** @return the icon to draw when turned off */
	function turnedOffIcon() {
		return {
			innerFill: rgba({a:0.5})	//grey
			,innerRing: rgba({}) //black
			,outerFill: null	//transparent
			,outerRing: rgba({})	//black
		}
	}
	
	/** @return the icon to draw when turned on*/
	function turnedOnIcon() {
		return {
			innerFill: rgba({g:1})
			,innerRing: rgba({})	//black
			,outerFill: null
			,outerRing: rgba({g:0.5})
		}
	}
	
	/** @return the icon to draw when playing*/
	function playingIcon() {
		return {
			innerFill: rgba({g:1})
			,innerRing: rgba({})	//black
			,outerFill: rgba({g:1,a:1})	//green
			,outerRing: rgba({g:0.5})
		}
	}
	
	//================================================= public =================================================
	/** the object to be returned */
	var drawer = {
		set canvas(cnv) {canvas = cnv;ctx = canvas.getContext("2d");}
		,set onRenderFinished(callback) {onRenderFinished = callback;}
	}
	
	drawer.drawTurnedOn = function() {
		//first execution: transform from default icon (off)
		if(!renderedIcon) setIcon({icon:turnedOffIcon()});
		setIcon({icon: turnedOnIcon(),length: 0.3});
	}
	drawer.drawTurnedOff = function() {
		setIcon({icon: turnedOffIcon(),length: 0.3});
	}
	
	drawer.drawPlaying = function() {
		setIcon({icon:playingIcon(),length:0.3});	//transmission length is 0 here!
	}
	return drawer;
});