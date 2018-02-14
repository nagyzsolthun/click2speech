(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=Date.now();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://ssl.google-analytics.com/analytics.js','analytics');

analytics('create', 'UA-67507804-1', 'auto');    //create tracker
analytics('set', 'checkProtocolTask', function(){})    //https://code.google.com/p/analytics-issues/issues/detail?id=312
analytics('set', 'page', '/background');

const event2scheduledAnalytics = {};

/** sends analytics after no change for 1 sec - event identified by category+action */
function scheduleAnalytics(category,action,label) {
    const key = category+action;

    const scheduled = event2scheduledAnalytics[key];
    if(scheduled) window.clearTimeout(scheduled);

    event2scheduledAnalytics[key] = window.setTimeout(() => sendAnalytics(category,action,label), 1000);
}

function sendAnalytics(category,action,label) {
    delete event2scheduledAnalytics[category+action];
    analytics('send', 'event', category, action, label);
    //console.log("send event: " + category + " " + action + " " + label);
}

export { scheduleAnalytics }
