const body = document.querySelector("body");
const span = body.querySelector("span");

function getTurnedOn() {
    // Firefox (w3c standard) case
    if(window.browser !== undefined) {
        return browser.storage.local.get("turnedOn")
            .then(settings => settings.turnedOn)
    }

    // Chrome case
    return new Promise(resolve =>
        chrome.storage.local.get("turnedOn", settings =>
            resolve(settings.turnedOn)));
}

function setTurnedOn(turnedOn) {
    // Firefox (w3c standard) case
    if(window.browser !== undefined) {
        return browser.storage.local.set({turnedOn:turnedOn}).then(turnedOn);
    }

    // Chrome case
    return new Promise(resolve =>
        chrome.storage.local.set({turnedOn:turnedOn}, () => resolve(turnedOn)));
}

function translate(text) {
    // Firefox (w3c standard) case
    if(window.browser !== undefined) {
        return browser.i18n.getMessage(text)
    }

    // Chrome case
    return chrome.i18n.getMessage(text)
}

function refreshPage(turnedOn) {
    span.innerHTML = turnedOn ? translate("turnOff") : translate("turnOn");
    body.className = turnedOn ? "ttsOn" : "ttsOff";
}

body.addEventListener("click", () => {
    getTurnedOn()
        .then(turnedOn => !turnedOn)
        .then(setTurnedOn)
        .then(refreshPage);
});

getTurnedOn().then(refreshPage);