(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=Date.now();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://ssl.google-analytics.com/analytics.js','analytics');

analytics('create', 'UA-67507804-1', 'auto');	//create tracker
analytics('set', 'checkProtocolTask', function(){})	//https://code.google.com/p/analytics-issues/issues/detail?id=312
analytics('set', 'page', '/background');

var event2scheduledAnalytics = {};

/** sends Google Analitics event */
function sendAnalytics(category,action,label) {
	//analytics('send', 'event', category, action, label);
	console.log("send event; category:" + category + " action:" + action + " label:" + label);
}

/** sends analytics after no change for 1 sec - events are defined by @param key */
function scheduleAnalytics(key,category,action,label) {
	var scheduled = event2scheduledAnalytics[key];
	if(scheduled) clearTimeout(scheduled);

	scheduled = window.setTimeout(function() {
		event2scheduledAnalytics[key] = undefined;
		sendAnalytics(category,action,label);
	}, 1000);
	event2scheduledAnalytics[key] = scheduled;
}

export { sendAnalytics, scheduleAnalytics }
