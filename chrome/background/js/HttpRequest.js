define([], function() {

return function(url) {
	/** @param event: success|error TODO error */
	this.addEventListener = function(event,callback) {
		getEventListenerArr(event).push(callback);
	}

	Object.defineProperty(this, "done", {
		get: function() {return done}
	});

	var eventListeners = {};
	function getEventListenerArr(event) {
		var result = eventListeners[event];
		if(!result) {
			result = [];
			eventListeners[event] = result;
		}
		return result;
	}

	var httpRequest = new XMLHttpRequest();
	var done = false;
	httpRequest.onreadystatechange = function() {
		if(httpRequest.readyState == 4) {
			done = true;
			if(httpRequest.status == 200) {
				getEventListenerArr("success").forEach(function(listener) {listener(httpRequest.responseText)});
				cleanUp();
			} else {
				getEventListenerArr("error").forEach(function(listener) {listener(httpRequest.statusText)});	//TODO test
				cleanUp();
			}
		}
	}
	httpRequest.open("GET", url);
	httpRequest.send(null);

	function cleanUp() {
		eventListeners = null;
		this.addEventListener = function(){};
	}
}

});
