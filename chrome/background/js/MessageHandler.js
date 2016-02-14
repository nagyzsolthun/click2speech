/** communucation between different scripts in the extension (content, background, options)
 * keeps track of all connections */
define([], function() {
	var ports = {};
	var counter = 0;

	chrome.runtime.onConnect.addListener(addPort);
	function addPort(port) {
		var id = counter;
		++counter;

		ports[id] = port;
		port.onMessage.addListener(function(message) {
			messageHandler.onMessage(message,port);
		});
		port.onDisconnect.addListener(function() {
			delete ports[id];
		});
	}

	// =============================== public ===============================
	var messageHandler = {};

	messageHandler.onMessage = function(message,port){};	//TODO handle an array of listeners?
	messageHandler.messageAll = function(message) {
		for(var id in ports)
			ports[id].postMessage(message);
	}

	return messageHandler;
});
