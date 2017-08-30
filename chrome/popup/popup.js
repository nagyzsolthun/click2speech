function translate(text) {
    return chrome.i18n.getMessage(text);
}

function refreshPage() {
    button.innerHTML = turnedOn ? translate("turnOff") : translate("turnOn");
    button.className = turnedOn ? "ttsOn" : "ttsOff";
}

var turnedOn = false;
const button = document.getElementsByTagName("button")[0];
button.addEventListener("click", () => {
    turnedOn = !turnedOn;
    chrome.storage.local.set({turnedOn: turnedOn });
    refreshPage();
})

chrome.storage.local.get("turnedOn", settings => {
    turnedOn = settings.turnedOn;
    refreshPage();
});
