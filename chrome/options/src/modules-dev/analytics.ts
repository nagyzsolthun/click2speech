function sendAnalytics(category: string, action: string, label: string) {
  const analytics = { category, action, label };
  console.log("analytics: " + JSON.stringify(analytics));
}

export default sendAnalytics;