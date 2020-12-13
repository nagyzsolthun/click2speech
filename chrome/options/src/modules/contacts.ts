import { useEffect, useState } from "react";

function useReviewsUrl() {
  useEffect(init, []); // empty array means executing only once
  const [reviewsUrl, setReviewsUrl] = useState<string>();
  function init() {
    const port = chrome.runtime.connect();
    port.postMessage("getBrowserName");
    port.onMessage.addListener(message => {
      const browserName = message.browserName;
      if(browserName === undefined) {
        return;
      }
      switch(browserName) {
        case "Firefox": setReviewsUrl("https://addons.mozilla.org/firefox/addon/click2speech/reviews/"); break;
        case "Edge": setReviewsUrl("https://microsoftedge.microsoft.com/addons/detail/click2speech/bfbogommemmgnandegidnimelabplhcm"); break;
        default: setReviewsUrl("https://chrome.google.com/webstore/detail/click2speech/djfpbemmcokhlllnafdmomgecdlicfhj"); break;
      }
    });
  }
  return reviewsUrl;
}

function useEmail() {
  useEffect(init, []); // empty array means executing only once
  const [email, setEmail] = useState<string>();
  const [emailUrl, setEmailUrl] = useState<string>();
  function init() {
    const email = "nagydotzsoltdothunatgmaildotcom".replace(/dot/g, ".").replace(/at/g, "@");    // obfuscate against spammers
    const emailUrl = "mailto:" + email + "?subject=click2speech question";
    setEmail(email);
    setEmailUrl(emailUrl);
  }
  return [email, emailUrl];
}

export { useReviewsUrl, useEmail }