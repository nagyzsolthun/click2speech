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
		
		context.lineWidth = 2.5;
		context.strokeStyle = "rgba(0,0,0," + alpha + ")";
		context.fillStyle = "rgba(255,255,255," + alpha + ")";
		
		//drawing the pointer happens on a 32x32 context - which is way too big for a 19x19 icon => lets scale
		context.scale(size/45, size/45);
		
		//the coordinates are given for a standing pointer (see options/img/pointer.svg), but we need another direction => rotate
		context.rotate(135*Math.PI/180);	//90 + 45 degress
		context.translate(-16, -60);	//many trials and errors
		context.beginPath();
		context.moveTo(12,0);
		context.lineTo(20,0);
		context.lineTo(20,10);
		context.lineTo(27,8);
		context.lineTo(16,32);
		context.lineTo(5,8);
		context.lineTo(12,10);
		context.closePath();
		context.fill();
		context.stroke();
		
		//revert rotate, translate, scale
		context.rotate(-135*Math.PI/180);
		context.translate(16, 60);
 		context.scale(45/size, 45/size);	//scale back
		
		if(alpha == 0 || alpha == 1) return true;	//animation finished TODO check
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