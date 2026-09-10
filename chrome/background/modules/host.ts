import browser from "webextension-polyfill";

// One host and one speech engine for both browsers. Only the document creation
// mechanism differs: Chrome requires offscreen; Firefox has a background DOM.
const api = browser as any;
const speechPath = "background/speech.html";
const speechUrl = browser.runtime.getURL(speechPath);
const ports = new Map<string, any>();
let creating: Promise<number>;
let generation = 0;
let frame: HTMLIFrameElement;

async function ensureSpeechDocument() {
    if (!creating) {
        creating = (async () => {
            if (typeof document !== "undefined") {
                if (frame) return generation;
                await new Promise<void>((resolve, reject) => {
                    frame = document.createElement("iframe");
                    frame.hidden = true;
                    frame.onload = () => resolve();
                    frame.onerror = () => { frame.remove(); frame = undefined; reject(new Error("Speech document failed to load")); };
                    frame.src = speechUrl;
                    document.documentElement.appendChild(frame);
                });
                generation++;
            } else {
                const contexts = await api.runtime.getContexts({contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [speechUrl]});
                if (!contexts.length) {
                    await api.offscreen.createDocument({
                        url: speechPath, reasons: ["AUDIO_PLAYBACK"],
                        justification: "Read text using SpeechSynthesisUtterance and play navigation feedback."
                    });
                    generation++;
                }
            }
            return generation;
        })().finally(() => { creating = undefined; });
    }
    return creating;
}

function send(type: string, data?: any, id?: string) {
    return browser.runtime.sendMessage({target: "speech", type, data, id});
}

// Restrict the API bridge to our own speech document, never content scripts.
browser.runtime.onMessage.addListener((message, sender) => {
    if (message && message.target === "speech") return;
    if (message && message.target === "host") {
        if (sender.url !== speechUrl || sender.tab) return;
        return hostCall(message.method, message.args).then(
            value => ({value}), error => ({error: error.message})
        );
    }
    if (!["getVoices", "getDisabledVoices", "getBrowserName", "arrowPressed"].includes(message)) return;
    return ensureSpeechDocument().then(() => send("request", message));
});

async function hostCall(method: string, args: any[]) {
    switch (method) {
        case "storage.get": return browser.storage.local.get(args[0]);
        case "storage.set": return browser.storage.local.set(args[0]);
        case "storage.remove": return browser.storage.local.remove(args[0]);
        case "detectLanguage": return browser.i18n.detectLanguage(args[0]);
        case "setIcon": {
            const {width, height, data} = args[0];
            return api.action.setIcon({imageData: new ImageData(new Uint8ClampedArray(data), width, height)});
        }
        case "postMessage": {
            const port = ports.get(args[0]);
            if (port) port.postMessage(args[1]);
            return;
        }
        case "heartbeat": return;
        default: throw new Error("Unknown speech host method");
    }
}

browser.runtime.onConnect.addListener(port => {
    if (port.name !== "click2speech") return;
    const id = crypto.randomUUID();
    ports.set(id, port);
    let connected = false;
    let connectedGeneration: number;
    const ready = ensureSpeechDocument().then(async currentGeneration => {
        if (!ports.has(id)) return;
        await send("connect", undefined, id);
        connected = true;
        connectedGeneration = currentGeneration;
        if (!ports.has(id)) await send("disconnect", undefined, id);
    });
    let pending = ready;
    port.onMessage.addListener(data => {
        pending = pending.then(async () => {
            const currentGeneration = await ensureSpeechDocument();
            if (!ports.has(id)) return;
            if (currentGeneration !== connectedGeneration) {
                await send("connect", undefined, id);
                connectedGeneration = currentGeneration;
            }
            await send("message", data, id);
        }).catch(() => port.disconnect());
    });
    port.onDisconnect.addListener(() => {
        ports.delete(id);
        if (connected) void send("disconnect", undefined, id).catch(() => {});
    });
    void ready.catch(error => { console.error(error); port.disconnect(); });
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.turnedOn) void setStaticIcon(changes.turnedOn.newValue === true);
    void send("storage", {changes, area}).catch(() => {});
});

browser.runtime.onInstalled.addListener(() => {
    // Only installation/update needs injection into existing tabs.
    void ensureSpeechDocument();
    void browser.tabs.query({}).then(tabs => Promise.all(tabs.map(tab =>
        api.scripting.executeScript({target: {tabId: tab.id}, files: ["content/content.js"]})
            .catch(() => {}) // Internal pages and other restricted URLs.
    )));
});

function setStaticIcon(turnedOn: boolean) {
    return api.action.setIcon({path: turnedOn ? "img/iconOn32.png" : "img/iconOff32.png"});
}

void browser.storage.local.get("turnedOn").then(({turnedOn}) => setStaticIcon(turnedOn === true));
