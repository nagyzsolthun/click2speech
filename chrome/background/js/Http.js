define([], function() {
	var http = {};
	/** @param c.url
	 * @param c.success */
	http.get = function(c) {
		var httpRequest = new XMLHttpRequest();
		httpRequest.onreadystatechange = function() {
			if(httpRequest.readyState == 4 && httpRequest.status == 200) {
				c.success(httpRequest.responseText);
			}
		}
		httpRequest.open("GET", c.url, true);
		httpRequest.send(null);
		//TODO fail
	}
	return http;
});
