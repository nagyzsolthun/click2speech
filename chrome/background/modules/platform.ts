import nativeBrowser, { Runtime, Storage } from "webextension-polyfill";

// The speech document only needs runtime messaging. This also works in Chrome's
// offscreen documents, where storage, i18n and action are unavailable.
async function call(method: string, ...args: any[]) {
    const response = await nativeBrowser.runtime.sendMessage({target: "host", method, args}) as {error?: string, value?: any};
    if (response.error) throw new Error(response.error);
    return response.value;
}

function event<T extends (...args: any[]) => any>() {
    const listeners = new Set<T>();
    return {
        addListener: (listener: T) => { listeners.add(listener); },
        removeListener: (listener: T) => { listeners.delete(listener); },
        emit: (...args: Parameters<T>) => { listeners.forEach(listener => listener(...args)); }
    };
}

const onConnect = event<(port: Runtime.Port) => void>();
const onChanged = event<(changes: {[key: string]: Storage.StorageChange}, area: string) => void>();
const ports = new Map<string, any>();
const messageListeners = new Set<(message: any) => any>();

nativeBrowser.runtime.onMessage.addListener(message => {
    if (!message || typeof message !== "object" || !("target" in message) || message.target !== "speech") return;
    const {type, id, data} = message as {type: string, id: string, data: any};
    if (type === "connect") {
        const port = {
            onMessage: event(), onDisconnect: event(),
            postMessage: (data: any) => call("postMessage", id, data)
        };
        ports.set(id, port);
        onConnect.emit(port as any);
    } else if (type === "disconnect") {
        const port = ports.get(id);
        ports.delete(id);
        if (port) port.onDisconnect.emit();
    } else if (type === "message") {
        const port = ports.get(id);
        if (port) port.onMessage.emit(data);
    } else if (type === "storage") {
        onChanged.emit(data.changes, data.area);
    } else if (type === "request") {
        for (const listener of messageListeners) {
            const result = listener(data);
            if (result !== undefined) return Promise.resolve(result);
        }
    }
    return Promise.resolve();
});

export const browser = {
    runtime: {onConnect, onMessage: {addListener: (listener: (message: any) => any) => messageListeners.add(listener)}},
    storage: {
        local: {
            get: (keys: any) => call("storage.get", keys),
            set: (items: any) => call("storage.set", items),
            remove: (keys: any) => call("storage.remove", keys)
        },
        onChanged
    },
    i18n: {detectLanguage: (text: string) => call("detectLanguage", text)},
    action: {setIcon: ({imageData}: {imageData: ImageData}) => call("setIcon", {
        width: imageData.width, height: imageData.height, data: Array.from(imageData.data)
    })}
};

// Keep request routing alive only while reading. Both background environments
// may be suspended when idle; no speech or settings state belongs in the host.
export function keepSpeechAlive() { return call("heartbeat"); }
