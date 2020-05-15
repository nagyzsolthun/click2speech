const voices = [
    {voice_name:"IBM Birgit",lang:"de",event_types:["start","sentence","end","error"],remote:true},
    {voice_name:"IBM Dieter",lang:"de",event_types:["start","sentence","end","error"],remote:true},
    {voice_name:"IBM Kate",lang:"en-GB",event_types:["start","sentence","end","error"],remote:true},
    {voice_name:"IBM Allison",lang:"en-US",event_types:["start","sentence","end","error"],remote:true},
    {voice_name:"IBM Michael",lang:"en-US",event_types:["start","sentence","end","error"],remote:true},
    {voice_name:"IBM Enrique",lang:"es-ES",event_types:["start","sentence","end","error"],remote:true},
    {voice_name:"IBM Laura",lang:"es-ES",event_types:["start","sentence","end","error"],remote:true},
    // {voice_name:"IBM Sofia",lang:"es-LA",event_types:["start","sentence","end","error"],remote:true}, TODO duplicate voice names
    {voice_name:"IBM Sofia",lang:"es-US",event_types:["start","sentence","end","error"],remote:true},
    {voice_name:"IBM Renee",lang:"fr",event_types:["start","sentence","end","error"],remote:true},
    {voice_name:"IBM Francesca",lang:"it",event_types:["start","sentence","end","error"],remote:true},
    {voice_name:"IBM Emi",lang:"ja",event_types:["start","sentence","end","error"],remote:true},
    {voice_name:"IBM Isabela",lang:"pt",event_types:["start","sentence","end","error"],remote:true}
];

var manifest = {
    manifest_version: 2,
    name: "click2speech",
    default_locale: "en",
    description: "__MSG_extensionDescription__",
    version: "1.6.0",
    content_scripts: [{
        matches: ["<all_urls>"],
        js: ["content/content.js"]
    }],
    permissions: ["http://*/","https://*/", "storage", "ttsEngine"],
    background : {"scripts": ["background/background.js"]},
    options_page: "options/index.html",
    browser_action: {
        default_icon: "img/iconOff32.png",
        default_popup: "popup/popup.html"
    },
    tts_engine: {voices},
    icons: {
        "16": "img/iconOn32.png",
        "128": "img/icon64.png"
    },
    minimum_chrome_version: "47",	// i18n.detectLanguage
    content_security_policy: "script-src 'self' https://ssl.google-analytics.com; object-src 'self'"	// Google Anyltics
}

console.log(JSON.stringify(manifest,null,2))
