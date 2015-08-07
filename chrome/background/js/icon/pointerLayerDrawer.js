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
		var alpha = calcAlpha(millis);
		
		context.lineWidth = 3;
		context.strokeStyle = "rgba(0,0,0," + alpha + ")";
		context.fillStyle = "rgba(255,255,255," + alpha + ")";

		context.scale(size/32, size/32);	//pointer is defined in a 32x32 grid, where top is in the origin
		context.translate(14, 14);	//move origin to center (not exavtly to center: top of pointer should cover the middle)
		context.rotate(-45 * Math.PI/180);	//45 degrees rotation
		context.scale(0.66,0.66);	//we actually use the 66% of the size of the pointer (see icon32On)

		context.beginPath();
		context.moveTo(0,0);
		context.lineTo(-11,24);
		context.lineTo(-4,22);
		context.lineTo(-4,32);
		context.lineTo(4,32);
		context.lineTo(4,22);
		context.lineTo(11,24);
		context.closePath();
		context.fill();
		context.stroke();
		
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
