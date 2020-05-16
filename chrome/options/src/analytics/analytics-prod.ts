// TODO ugly
const env = process.env.NODE_ENV;
const backgroundCommunicationPort = (env === "production") ? chrome.runtime.connect() : null

function sendAnalytics(category: string, action: string, label: string) {
  const analytics = { category, action, label };
  backgroundCommunicationPort?.postMessage({action: "sendAnalytics", analytics});
}

export default sendAnalytics;