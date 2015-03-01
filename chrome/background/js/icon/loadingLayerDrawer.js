define([], function() {
	var ctx;	//TODO shouldnt be an attribute
	var size = 18;	//TODO from setter
	var quarter = size/4;
	
	var speed = 0.5;	//rounds/sec
	var start = null;
	
	function render(millis) {
		ctx.lineWidth = 3;
		ctx.strokeStyle = "rgba(0,0,255," + 1 + ")";
		
		var rotPos = ((millis-start)/1000.0) * 2*Math.PI * speed;
		ctx.beginPath();
		ctx.arc(size/2,size/2, size/2-2, rotPos, rotPos + Math.PI*0.66);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.arc(size/2,size/2, size/2-2, rotPos + Math.PI, rotPos + Math.PI*1.66);
		ctx.stroke();
	}
	
	// ============================ public ============================
	var drawer = {set ctx(context) {ctx = context;}};
	drawer.setOn = function() {start = Date.now();}
	drawer.setOff = function() {
		start = false;
	}

	/** @param millis the time at when the animation is rendered
	 * @return true if animation has finished*/
	drawer.render = function(millis) {
		if(!start) return true;
		render(millis);
		return false;
	}
	return drawer;
});