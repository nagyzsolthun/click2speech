import { browser } from "webextension-polyfill-ts"

function sendAnalytics(category: string, action: string, label: string) {
  const analytics = { category, action, label };
  browser.runtime.sendMessage({analytics});
}

export default sendAnalytics;