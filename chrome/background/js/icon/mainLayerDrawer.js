define([], function() {
	var context;	//TODO maybe not as an attibute
	var size;
	var quarter;	//should be size/4
	
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
		,outerRing: rgba({r:0.2,g:0.2,b:0.2})
	}
	
	var playingIcon = {
		innerFill: rgba({b:1})
		,innerRing: rgba({})	//black
		,outerFill: rgba({b:1,a:0.5})
		,outerRing: rgba({b:0.5})
	}
	
	var errorIcon = {
		innerFill: rgba({r:1})
		,innerRing: rgba({})	//black
		,outerFill: null
		,outerRing: rgba({})	//black
	}
	
	var errorAnimationIcon = {
		innerFill: rgba({r:1})
		,innerRing: rgba({})	//black
		,outerFill: rgba({r:1})
		,outerRing: rgba({})	//black
	}
	
	var loadingIcon = {
		innerFill: null
		,innerRing: rgba({a:0.2})	//grey
		,outerFill: null
		,outerRing: null
	}
	
	var interactionAnimationIcon = {
		innerFill: rgba({g:0.7})
		,innerRing: rgba({})	//black
		,outerFill: rgba({g:0.7})
		,outerRing: rgba({r:0.2,g:0.2,b:0.2})
	}
	
	var renderedIcon = turnedOffIcon;	//stores the last drawn state
	var targetIcon = turnedOffIcon;	//in case an animation request comes in while animating, this icon is will be the end
	var animation;	//current/last-finished animation
	
	/** draws a filled circle with given parameters to the middle of the canvas
	* @param c.color color
	* @param c.r radius*/
	function drawBall(c) {
		context.fillStyle = c.color;
		context.beginPath();
		context.arc(2*quarter, 2*quarter, c.r, 0, 2*Math.PI);
		context.fill();
	}
	
	/** draws a non-filled circle with given parameters to the middle of the canvas
	* @param c.color color
	* @param c.width width
	* @param c.r radius*/
	function drawRing(c) {
		context.lineWidth = c.width;
		context.strokeStyle = c.color;
		context.beginPath();
		context.arc(2*quarter, 2*quarter, c.r, 0, 2*Math.PI);
		context.stroke();
	}
	
	/** @return a filled rgba object - or null if given o is null
	 * @param o.r the red component of result - defaults to 0
	 * @param o.g the green component of result - defaults to 0
	 * @param o.b the blue component of result - defaults to 0
	 * @param o.a the alpha component of result - defaults to 1*/
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
	 * @param o rgba object*/
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
	 * @param icon.outerRing: the color of the outer ring as rgba object*/
	function render(icon) {
		var transparent = "rgba(0,0,0,0)";
		
		drawBall({color:htmlColor(icon.outerFill) || transparent,r:quarter*2*0.9});
		drawRing({color:htmlColor(icon.outerRing) || transparent, r:quarter*2*0.9, width:size/16});
		
		drawBall({color:htmlColor(icon.innerFill) || transparent,r:quarter*0.9});
		drawRing({color:htmlColor(icon.innerRing) || transparent, r:quarter*0.9, width:size/16});
		
		renderedIcon = icon;
	}
	
	/** @return the mix of given 2 rgba objects with given weights
	 * @param c1 the first color as rgba object
	 * @param c2 the second color as rgba object
	 * @param w1 the weight of the 1st rgba
	 * @param w2 the weight of the 2nd rgba*/
	function mix(c1, c2, w1, w2) {
		var result = {};
		if(!c1 && !c2) return;
		c1 = c1 || {r:c2.r,g:c2.g,b:c2.b,a:0};	//null source is transparent target
		c2 = c2 || {r:c1.r,g:c1.g,b:c1.b,a:0};	//null target is transparent source

		result.r = (c1.r*w1+c2.r*w2) / (w1+w2);
		result.g = (c1.g*w1+c2.g*w2) / (w1+w2);
		result.b = (c1.b*w1+c2.b*w2) / (w1+w2);
		result.a = (c1.a*w1+c2.a*w2) / (w1+w2);
		return result;
	}
	
	/** @return the icon to be drawn at @param millis */
	var iconAt = function(millis) {
		if(! animation) return renderedIcon;
		if(millis < animation.start) return renderedIcon;
		
		var start = animation.start;
		for(var i=0; i<animation.transitions.length; ++i) {
			var transition = animation.transitions[i];
			if(start + transition.length > millis) {
				//we found the transition to use, it starts at "start" and ends at "start + transition.length"
				var w1 = transition.length - (millis-start);
				var w2 = millis - start;
				return {
					innerFill:mix(transition.from.innerFill, transition.to.innerFill,w1,w2)
					,innerRing:mix(transition.from.innerRing, transition.to.innerRing,w1,w2)
					,outerFill:mix(transition.from.outerFill, transition.to.outerFill,w1,w2)
					,outerRing:mix(transition.from.outerRing, transition.to.outerRing,w1,w2)
				}
			}
			start += transition.length;
		}
		return targetIcon;
	}
	
	// ============================ public ============================
	var drawer = {
		set canvas(canvas) {
			context = canvas.getContext("2d");
			size = canvas.width;
			quarter = size/4;
		}
	};
	
	drawer.setOn = function() {
		targetIcon = turnedOnIcon;
		animation = {start: Date.now(),transitions: [{from:renderedIcon,to:turnedOnIcon,length:300}]};
	}
	
	drawer.setOff = function() {
		targetIcon = turnedOffIcon;
		animation = {start: Date.now(),transitions: [{from:renderedIcon,to:turnedOffIcon,length:300}]};
	}
	
	drawer.setError = function() {
		targetIcon = errorIcon;
		animation = {start: Date.now(),transitions: [{from:renderedIcon,to:turnedOffIcon,length:300}]};
	}
	
	drawer.setPlaying = function() {
		targetIcon = playingIcon;
		animation = {start: Date.now(),transitions: [{from:renderedIcon,to:playingIcon,length:300}]};
	}
	
	drawer.setLoading = function() {
		targetIcon = loadingIcon;
		animation = {start: Date.now(),transitions: [{from:renderedIcon,to:loadingIcon,length:300}]};
	}
	
	drawer.animateError = function() {
		animation = {start: Date.now(),transitions: [
			{from:renderedIcon,to:errorAnimationIcon,length:200}
			,{from:errorAnimationIcon,to:errorIcon,length:200}
			,{from:errorIcon,to:errorAnimationIcon,length:200}
			,{from:errorAnimationIcon,to:errorIcon,length:200}
			,{from:errorIcon,to:errorAnimationIcon,length:200}
			,{from:errorAnimationIcon,to:targetIcon,length:200}
		]};
	}
	
	drawer.animateInteraction = function() {
		animation = {start: Date.now(),transitions: [
			{from:renderedIcon,to:interactionAnimationIcon,length:200}
			,{from:interactionAnimationIcon,to:targetIcon,length:200}
		]};
	}

	/** @param millis the time at when the animation is rendered
	 * @return true if animation has finished*/
	drawer.render = function(millis) {
		var icon = iconAt(millis);
		render(icon);
		return icon == targetIcon;
	}
	return drawer;
});
