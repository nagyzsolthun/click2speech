import browser from "webextension-polyfill"

export default function(text: string) {
  return browser.i18n.getMessage(text) || text;
}