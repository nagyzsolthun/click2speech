export default function(text: string) {
  return chrome.i18n.getMessage(text) || text;
}