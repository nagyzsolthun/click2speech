/**draws the icon of WebReader - the look depends on the volume of playing and the status (on/off) */
define(function(rgbaAnimationHandler) {
	var size = 18;	//TODO from setter
	var quarter = size/4;

	var ctx;
	var canvas;
	
	var renderedIcon;	//stores the last drawn icon

	//whenever a transition starts this variable is set as the target
	//so when an animation starts in the menawhile, targetIcon will set at the end
	var targetIcon;

	var animationId;	//the id of the last started transition
	
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
	
	/** animates several transitions after each other
	 * @param a.forever if true the animation from the begining when finishes
	 * @param a.fps the fps of the enaimation (100 by default)
	 * @param a.transitions is an array of transitions, where trannsition t is:
	 * 		@param t.length the length of the transition (transition between the rendered icon and given icon)
	 * 		@param t.icon the icon to draw*/
	function animate(a) {
		targetIcon = a.transitions[a.transitions.length-1].icon;
		
		if(animationId) window.clearInterval(animationId);
		
		var fps = a.fps || 100;
		
		var transitionIndex = 0;	//we iterate over each transition and animate it
		var currentTransition = a.transitions[transitionIndex];
		var from = renderedIcon || currentTransition.icon;	//source of the animation
		var to = currentTransition.icon;

		var allFrames = currentTransition.length*fps || 1;	//how many frames will the transition take?
		var currentFrame = 0;
		animationId = window.setInterval(function() {
			if(++currentFrame > allFrames) {	//reached the end of a transition
				currentTransition = a.transitions[++transitionIndex];
				if(! currentTransition) {
					if(a.forever) {
						transitionIndex = 0;
						currentTransition = a.transitions[0];
					} else {
						window.clearInterval(animationId);
						return;
					}
				}

				from = renderedIcon;
				to = currentTransition.icon;
				allFrames = currentTransition.length*fps || 1;
				currentFrame = 0;
			}
			render({
				innerFill:mix(from.innerFill, to.innerFill, currentFrame/allFrames)
				,innerRing:mix(from.innerRing, to.innerRing, currentFrame/allFrames)
				,outerFill:mix(from.outerFill, to.outerFill, currentFrame/allFrames)
				,outerRing:mix(from.outerRing, to.outerRing, currentFrame/allFrames)
			});
		}, 1000/fps);
	}
	
	/** animates a transition between the current icon and the one given in c (alias for a simple animation call)
	 * @param c.length the length of the animation
	 * @param c.fps frames per second (defaults to 100)
	 * @param c.icon the icon to draw
	 */
	function drawTransition(c) {
		animate({
			transitions:[{icon:c.icon,length:c.length}]
			,fps: c.fps
		});
	}
	
	var turnedOffIcon = {
		innerFill: rgba({a:0.5})	//grey
		,innerRing: rgba({}) //black
		,outerFill: null	//transparent
		,outerRing: rgba({})	//black
	}
	
	var turnedOnIcon = {
		innerFill: rgba({g:1})
		,innerRing: rgba({})	//black
		,outerFill: null
		,outerRing: rgba({g:0.5})
	}
	
	var loadingIcon = {
		innerFill: rgba({b:1})
		,innerRing: rgba({})	//black
		,outerFill: rgba({b:1,a:1})	//blue
		,outerRing: rgba({b:0.5})
	}
	
	var playingIcon = {
		innerFill: rgba({g:1})
		,innerRing: rgba({})	//black
		,outerFill: rgba({g:1,a:1})	//green
		,outerRing: rgba({g:0.5})
	}
	
	/** @return the icon to show when error occours */
	var errorIcon = {
		innerFill: rgba({r:1})
		,innerRing: rgba({})	//black
		,outerFill: rgba({r:1})
		,outerRing: rgba({})	//black
	}
	
	//================================================= public =================================================
	/** the object to be returned */
	var drawer = {
		set canvas(cnv) {canvas = cnv;ctx = canvas.getContext("2d");}
		,set onRenderFinished(callback) {onRenderFinished = callback;}
	}
	
	drawer.drawTurnedOn = function() {
		//first execution: transform from default icon (off)
		if(!renderedIcon)
			animate({
				transitions:[
					{icon:turnedOffIcon}
					,{icon: turnedOnIcon,length: 0.3}
				]
			});
		else drawTransition({icon: turnedOnIcon,length: 0.3});
	}
	
	drawer.drawTurnedOff = function() {
		drawTransition({icon: turnedOffIcon,length: 0.3});
	}
	
	drawer.drawPlaying = function() {
		drawTransition({icon:playingIcon,length:0.3});
	}
	
	drawer.drawMissed = function() {
		animate({
			transitions: [
				{icon:errorIcon, length:0.1}
				,{icon:targetIcon || renderedIcon, length:0.5}
			]
		});
	}
	
	drawer.drawLoading = function() {
		animate({
			transitions: [
				{icon:loadingIcon, length:0.2}
				,{icon:targetIcon || renderedIcon, length:0.5}
			]
		});
	}
	return drawer;
});