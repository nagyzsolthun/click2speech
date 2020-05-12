var turnedOn = false;
const body = document.querySelector("body");
const span = body.querySelector("span");

function translate(text) {
    return chrome.i18n.getMessage(text);
}

function refreshPage() {
    span.innerHTML = turnedOn ? translate("turnOff") : translate("turnOn");
    body.className = turnedOn ? "ttsOn" : "ttsOff";
}

body.addEventListener("click", () => {
    turnedOn = !turnedOn;
    chrome.storage.local.set({turnedOn: turnedOn });
    refreshPage();
})

chrome.storage.local.get("turnedOn", settings => {
    turnedOn = settings.turnedOn;
    refreshPage();
});
