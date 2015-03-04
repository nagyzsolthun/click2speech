define([], function() {
	var context;	//TODO maybe not as an attibute
	var size;
	
	var speed = 0.5;	//rounds/sec
	var fadeLength = 300;	//millisec
	
	var start = null;	//start in millisec
	var end = Date.now();	//end in millisec
	
	/** @return the alpha value for given millis:
	 *0 at startTime
	 * 1 at startTime + fadeLength
	 * 1 at endTime
	 * 0 at endTime + fadeLength*/
	function calcAlpha(millis) {
		if(end) {
			if(end < millis) return 0;
			if(end-fadeLength > millis) return 1;
			return (end-millis)/fadeLength;
		}
		if(start) {
			if(start > millis) return 0;
			if(start+fadeLength < millis) return 1;
			return (millis-start)/fadeLength;
		}
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
		
		if(end && !alpha) return true;
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
		end = null;
		start = Date.now();
	}
	drawer.setOff = function() {
		if(end) return;	//already ended, no need to animate again
		end = Date.now() + fadeLength;
	}

	/** @param millis the time at when the animation is rendered
	 * @return true if animation has finished*/
	drawer.render = function(millis) {
		return render(millis);
	}
	return drawer;
});