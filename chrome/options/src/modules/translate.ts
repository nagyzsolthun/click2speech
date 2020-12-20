import { browser } from "webextension-polyfill-ts"

export default function(text: string) {
  return browser.i18n.getMessage(text) || text;
}