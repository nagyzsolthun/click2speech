import React from "react";
import translate from "../translate";

const extensionUrl = "https://chrome.google.com/webstore/detail/click2speech/djfpbemmcokhlllnafdmomgecdlicfhj";
const reviewsUrl = extensionUrl + "/reviews";
const email = "nagydotzsoltdothunatgmaildotcom".replace(/dot/g, ".").replace(/at/g, "@");    // obfuscate against spammers
const emailUrl = "mailto:" + email + "?subject=click2speech question";
const reviews = translate('reviews');
const support = translate('support');

const backgroundCommunicationPort = process.env.NODE_ENV !== 'development' ? chrome.runtime.connect() : null;

function sendAnalytics(interaction: string) {
  if(!backgroundCommunicationPort) {
    console.log(interaction)
    return; // development env
  }
  backgroundCommunicationPort.postMessage({ action: "contactInteraction", interaction });
}

const Contact = () => (
  <div className="Contact">
    <div className="setting hoverable">
      <div>{reviews}</div>
      <a href={reviewsUrl}
        onClick={e => sendAnalytics('reviews-click')}
        target="_blank"
      >{reviewsUrl}</a>
    </div>
    <div className="setting hoverable">
      <div>{support}</div>
      <a href={emailUrl}
        onClick={e => sendAnalytics('support-click')}
      >{email}</a>
    </div>
  </div>
);

export default Contact as React.FC;