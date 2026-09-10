// Exercise the shared Web Speech engine without either browser's DOM host.
describe("MV3 speech lifecycle", () => {
    let connect: (port: any) => Promise<void>;
    let storageChanged: (changes: any, area: string) => Promise<void>;
    let getVoice: jest.Mock;
    let synthesis: any;
    let settings: any;
    let ports: any[];

    async function flush() { for (let i = 0; i < 30; i++) await Promise.resolve(); }
    async function port() {
        const result: any = {postMessage: jest.fn()};
        result.onMessage = {addListener: listener => { result.send = listener; }};
        result.onDisconnect = {addListener: listener => { result.close = listener; }};
        await connect(result);
        ports.push(result);
        return result;
    }

    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers();
        ports = [];
        settings = {turnedOn: true, speed: 1.2};
        getVoice = jest.fn().mockResolvedValue({name: "English", lang: "en-US"});
        synthesis = {speak: jest.fn(), cancel: jest.fn(), pause: jest.fn(), resume: jest.fn()};
        Object.defineProperty(globalThis, "navigator", {value: {userAgent: "Chrome"}, configurable: true});
        (globalThis as any).speechSynthesis = synthesis;
        (globalThis as any).SpeechSynthesisUtterance = class {
            listeners = new Map();
            constructor(public text: string) {}
            addEventListener(type, listener) { this.listeners.set(type, listener); }
            emit(type, event = {}) { this.listeners.get(type)?.(event); }
        };
        (globalThis as any).Audio = class { play() { return Promise.resolve(); } };
        (globalThis as any).document = {createElement: () => ({getContext: () => ({getImageData: () => ({})})})};
        jest.doMock("./platform", () => ({
            keepSpeechAlive: jest.fn().mockResolvedValue(undefined),
            browser: {
                runtime: {
                    onMessage: {addListener: jest.fn()},
                    onConnect: {addListener: listener => { connect = listener; }}
                },
                storage: {
                    local: {
                        get: jest.fn(async key => key === null ? {...settings} : {[key]: settings[key]}),
                        set: jest.fn(async items => { Object.assign(settings, items); }),
                        remove: jest.fn()
                    },
                    onChanged: {addListener: listener => { storageChanged = listener; }}
                },
                action: {setIcon: jest.fn()}
            }
        }));
        jest.doMock("./tts/VoiceSelector", () => ({getVoice, getDefaultVoiceName: async () => "English", getSortedVoices: async () => []}));
        jest.doMock("./icon/drawer", () => new Proxy({}, {get: () => jest.fn()}));
        jest.doMock("./pop.wav", () => "pop.wav");
        require("./background");
    });

    afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

    it("uses SpeechSynthesisUtterance and forwards boundaries and completion", async () => {
        const p = await port();
        p.send({id: "one", text: "Hello world"});
        await flush();
        const utterance = synthesis.speak.mock.calls[0][0];
        expect(utterance).toBeInstanceOf((globalThis as any).SpeechSynthesisUtterance);
        expect(utterance.rate).toBe(1.2);
        utterance.emit("start");
        utterance.emit("boundary", {charIndex: 0, charLength: 5});
        utterance.emit("end");
        await flush();
        expect(p.postMessage).toHaveBeenCalledWith({speechStart: "one"});
        expect(p.postMessage).toHaveBeenCalledWith({speechBoundary: {id: "one", startOffset: 0, endOffset: 5, text: "Hello"}});
        expect(p.postMessage).toHaveBeenCalledWith({speechEnd: "one"});
        expect(jest.getTimerCount()).toBe(0);
    });

    it("does not speak a request cancelled while voice selection is pending", async () => {
        const p = await port();
        let resolveVoice;
        getVoice.mockImplementationOnce(() => new Promise(resolve => { resolveVoice = resolve; }));
        p.send({id: "old", text: "Old"});
        await flush();
        p.send({id: "new", text: "New"});
        await flush();
        resolveVoice({name: "English"});
        await flush();
        expect(synthesis.speak).toHaveBeenCalledTimes(1);
        expect(synthesis.speak.mock.calls[0][0].text).toBe("New");
        expect(p.postMessage).toHaveBeenCalledWith({speechEnd: "old"});
    });

    it("stops on disconnect even when the speech engine emits no cancel event", async () => {
        const p = await port();
        p.send({id: "one", text: "Hello"});
        await flush();
        const utterance = synthesis.speak.mock.calls[0][0];
        p.close();
        await flush();
        p.postMessage.mockClear();
        utterance.emit("start");
        utterance.emit("end");
        expect(p.postMessage).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    it("cancels pending speech when turned off", async () => {
        const p = await port();
        let resolveVoice;
        getVoice.mockImplementationOnce(() => new Promise(resolve => { resolveVoice = resolve; }));
        p.send({id: "one", text: "Hello"});
        await flush();
        settings.turnedOn = false;
        await storageChanged({turnedOn: {newValue: false}}, "local");
        resolveVoice({name: "English"});
        await flush();
        expect(synthesis.speak).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });
});
