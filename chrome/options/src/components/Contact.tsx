import React from "react";
import translate from "../translate";
import { FormControl, FormLabel, Link, Box, Divider } from "@material-ui/core";

const extensionUrl = "https://chrome.google.com/webstore/detail/click2speech/djfpbemmcokhlllnafdmomgecdlicfhj";
const reviewsUrl = extensionUrl + "/reviews";
const email = "nagydotzsoltdothunatgmaildotcom".replace(/dot/g, ".").replace(/at/g, "@");    // obfuscate against spammers
const emailUrl = "mailto:" + email + "?subject=click2speech question";

const backgroundCommunicationPort = process.env.NODE_ENV !== 'development' ? chrome.runtime.connect() : null;

function sendAnalytics(interaction: string) {
  if(!backgroundCommunicationPort) {
    return; // development env
  }
  backgroundCommunicationPort.postMessage({ action: "contactInteraction", interaction });
}

const Contact = () => (
  <Box>
    <FormControl>
      <FormLabel>{translate("reviews")}</FormLabel>
      <Link
        href={reviewsUrl}
        target="_blank"
        rel="noopener"
        onClick={() => sendAnalytics('reviews-click')}
      >{reviewsUrl}</Link>
    </FormControl>
    <Divider/>
    <FormControl>
      <FormLabel>{translate("support")}</FormLabel>
      <Link
        href={emailUrl}
        onClick={() => sendAnalytics('support-click')}
      >{email}</Link>
    </FormControl>
  </Box>
);

export default Contact as React.FC;