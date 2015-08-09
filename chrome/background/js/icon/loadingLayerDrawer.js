define([], function() {
	var context;	//TODO maybe not as an attibute
	var size;
	
	var speed = 0.5;	//rounds/sec

	//when calling setOn or setOff, these values are manipulated
	var fadeLength = 300;	//millisec
	var start = 0;	//start of start animation
	var end = Date.now() - fadeLength;	//start of end animation
	//end is set to a later point, so when initial setOff is received, NO animation happens
	
	/** @return the alpha value for given millis */
	function calcAlpha(millis) {
		var fadeInAlpha = (millis-start)/fadeLength;
		fadeInAlpha = (fadeInAlpha<0)?0:fadeInAlpha;
		fadeInAlpha = (fadeInAlpha>1)?1:fadeInAlpha;
		
		var fadeOutAlpha = 1 - (millis-end)/fadeLength;
		fadeOutAlpha = (fadeOutAlpha<0)?0:fadeOutAlpha;
		fadeOutAlpha = (fadeOutAlpha>1)?1:fadeOutAlpha;
		
		if(start<end) {
			//end is next => tend to disappear => prefer the LOWER alpha
			return (fadeInAlpha<fadeOutAlpha)?fadeInAlpha:fadeOutAlpha;
		}
		if(end<start) {
			//start is next => tend to appear => prefer the HIGHER alpha
			return (fadeInAlpha<fadeOutAlpha)?fadeOutAlpha:fadeInAlpha;
		}
		return 1;
	}
	
	function render(millis) {
		var rotPos = ((millis/1000.0) * 2*Math.PI*speed) % (2*Math.PI);
		var alpha = calcAlpha(millis);
		
		context.lineWidth = 3;
		context.strokeStyle = "rgba(0,0,255," + alpha + ")";
		
		context.beginPath();
		context.arc(size/2,size/2, size/2-2, rotPos, rotPos + Math.PI*0.66);
		context.stroke();
		
		context.beginPath();
		context.arc(size/2,size/2, size/2-2, rotPos + Math.PI, rotPos + Math.PI*1.66);
		context.stroke();
		
		//animation should go on until the layer totally disappears
		if(!alpha) return true;
		else return false;
	}
	
	// ============================ public ============================
	var drawer = {
		set canvas(canvas) {
			context = canvas.getContext("2d");
			size = canvas.width;
		}
	};
	drawer.setOn = function() {
		if(end < start) return;	//animation already finished/happening
		start = Date.now();
	}
	drawer.setOff = function() {
		if(start < end) return;	//animation already finished/happening
		end = Date.now();
	}

	/** @param millis the time at when the animation is rendered
	 * @return true if animation has finished*/
	drawer.render = function(millis) {
		return render(millis);
	}
	return drawer;
});