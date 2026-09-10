describe("shared MV3 background host", () => {
    let api: any;
    let message: (message: any, sender?: any) => any;
    let connect: (port: any) => void;
    let storageChanged: (changes: any, area: string) => void;
    let contexts: any[];
    let append: jest.Mock;
    const url = "chrome-extension://test/background/speech.html";
    async function flush() { for (let i = 0; i < 30; i++) await Promise.resolve(); }

    function start(documentAvailable: boolean) {
        jest.resetModules();
        contexts = [];
        append = jest.fn(frame => frame.onload());
        (globalThis as any).document = documentAvailable ? {
            createElement: () => ({}), documentElement: {appendChild: append}
        } : undefined;
        Object.defineProperty(globalThis, "crypto", {value: {randomUUID: () => "port-id"}, configurable: true});
        api = {
            runtime: {
                getURL: () => url,
                getContexts: jest.fn(async () => contexts),
                onMessage: {addListener: listener => { message = listener; }},
                onConnect: {addListener: listener => { connect = listener; }},
                onInstalled: {addListener: jest.fn()},
                sendMessage: jest.fn().mockResolvedValue(undefined)
            },
            storage: {
                local: {get: jest.fn().mockResolvedValue({turnedOn: true}), set: jest.fn(), remove: jest.fn()},
                onChanged: {addListener: listener => { storageChanged = listener; }}
            },
            offscreen: {createDocument: jest.fn(async () => { contexts = [{}]; })},
            action: {setIcon: jest.fn()},
            i18n: {detectLanguage: jest.fn()}
        };
        jest.doMock("webextension-polyfill", () => api);
        require("./host");
    }

    [false, true].forEach(dom => it(`creates one speech document for concurrent requests (DOM: ${dom})`, async () => {
        start(dom);
        await Promise.all([message("getVoices"), message("getBrowserName")]);
        expect(dom ? append : api.offscreen.createDocument).toHaveBeenCalledTimes(1);
        expect(dom ? api.offscreen.createDocument : append).not.toHaveBeenCalled();
        expect(api.runtime.sendMessage).toHaveBeenCalledWith({target: "speech", type: "request", data: "getVoices", id: undefined});
    }));

    it("recreates an expired offscreen document and reconnects before forwarding speech", async () => {
        start(false);
        let send;
        connect({name: "click2speech", onMessage: {addListener: listener => { send = listener; }}, onDisconnect: {addListener: jest.fn()}, disconnect: jest.fn()});
        await flush();
        contexts = [];
        api.runtime.sendMessage.mockClear();
        send({id: "request", text: "Hello"});
        await flush();
        expect(api.offscreen.createDocument).toHaveBeenCalledTimes(2);
        expect(api.runtime.sendMessage.mock.calls.map(([m]) => m.type)).toEqual(["connect", "message"]);
    });

    it("rejects privileged API requests originating in a content script", async () => {
        start(false);
        api.storage.local.set.mockClear();
        const request = {target: "host", method: "storage.set", args: [{turnedOn: false}]};
        expect(message(request, {url: "https://example.com", tab: {id: 1}})).toBeUndefined();
        expect(api.storage.local.set).not.toHaveBeenCalled();
        await message(request, {url});
        expect(api.storage.local.set).toHaveBeenCalledWith({turnedOn: false});
    });

    it("updates the toggle icon without waking the idle speech document", async () => {
        start(false);
        await flush();
        storageChanged({turnedOn: {newValue: false}}, "local");
        await flush();
        expect(api.action.setIcon).toHaveBeenCalledWith({path: "img/iconOff32.png"});
        expect(api.offscreen.createDocument).not.toHaveBeenCalled();
    });
});
