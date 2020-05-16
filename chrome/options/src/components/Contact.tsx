import React from "react";
import translate from "../translate";
import { FormControl, FormLabel, Link, Box, Divider } from "@material-ui/core";
import sendAnalytics from "../analytics";

const extensionUrl = "https://chrome.google.com/webstore/detail/click2speech/djfpbemmcokhlllnafdmomgecdlicfhj";
const reviewsUrl = extensionUrl + "/reviews";
const email = "nagydotzsoltdothunatgmaildotcom".replace(/dot/g, ".").replace(/at/g, "@");    // obfuscate against spammers
const emailUrl = "mailto:" + email + "?subject=click2speech question";

const Contact = () => (
  <Box>
    <FormControl>
      <FormLabel>{translate("reviews")}</FormLabel>
      <Link
        href={reviewsUrl}
        target="_blank"
        rel="noopener"
        onClick={() => sendAnalytics("interaction", "contact", "reviews-click")}
      >{reviewsUrl}</Link>
    </FormControl>
    <Divider/>
    <FormControl>
      <FormLabel>{translate("support")}</FormLabel>
      <Link
        href={emailUrl}
        onClick={() => sendAnalytics("interaction", "contact", "support-click")}
      >{email}</Link>
    </FormControl>
  </Box>
);

export default Contact as React.FC;