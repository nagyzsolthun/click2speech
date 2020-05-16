const backgroundCommunicationPort = chrome.runtime.connect()

function sendAnalytics(category: string, action: string, label: string) {
  const analytics = { category, action, label };
  backgroundCommunicationPort.postMessage({action: "sendAnalytics", analytics});
}

export default sendAnalytics;