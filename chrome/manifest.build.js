var manifest = {
    manifest_version: 3,
    name: "click2speech",
    default_locale: "en",
    description: "__MSG_extensionDescription__",
    version: "3.0.0",
    content_scripts: [{
        matches: ["<all_urls>"],
        js: ["content/content.js"]
    }],
    permissions: ["storage", "scripting", "offscreen"],
    host_permissions: ["<all_urls>"],
    background: {
        service_worker: "background/host.js",
        scripts: ["background/host.js"]
    },
    options_ui: {
        page: "options/index.html",
        open_in_tab: true
    },
    action: {
        default_icon: "img/iconOff32.png",
        default_popup: "popup/popup.html"
    },
    icons: {
        "16": "img/iconOn32.png",
        "128": "img/icon64.png"
    },
    minimum_chrome_version: "121", // supports the shared background declaration
    browser_specific_settings: {gecko: {
        id: "{961b86e9-adc2-43bc-bc8c-aa99ea2a047b}",
        strict_min_version: "128.0"
    }},
}

console.log(JSON.stringify(manifest,null,2))
