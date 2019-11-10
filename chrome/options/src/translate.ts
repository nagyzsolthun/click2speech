export default function(text: string) {
  if(!chrome || !chrome.i18n) {
    return text;  // for testing outside chrome
  }
  return chrome.i18n.getMessage(text) || text;
}