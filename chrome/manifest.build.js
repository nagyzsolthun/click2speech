var manifest = {
    manifest_version: 2,
    name: "click2speech",
    default_locale: "en",
    description: "__MSG_extensionDescription__",
    version: "2.1.4",
    content_scripts: [{
        matches: ["<all_urls>"],
        js: ["content/content.js"]
    }],
    permissions: ["http://*/","https://*/", "storage"],
    background : {"scripts": ["background/background.js"]},
    options_ui: {
        page: "options/index.html",
        open_in_tab: true
    },
    browser_action: {
        default_icon: "img/iconOff32.png",
        default_popup: "popup/popup.html"
    },
    icons: {
        "16": "img/iconOn32.png",
        "128": "img/icon64.png"
    },
    minimum_chrome_version: "47",	// i18n.detectLanguage
}

console.log(JSON.stringify(manifest,null,2))
