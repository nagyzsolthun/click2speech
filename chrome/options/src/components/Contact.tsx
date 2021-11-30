import React from "react";
import { FormControl, FormLabel, Link, Box, Divider } from "@material-ui/core";
import translate from "../modules/translate";
import sendAnalytics from "../modules/analytics";
import { useReviewsUrl, useEmail } from "../modules/contacts";

const Contact = () => {
  const reviewsUrl = useReviewsUrl();
  const [email, emailUrl] = useEmail();

  if(!reviewsUrl || !emailUrl) {
    return null;
  }

  return (
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
  )
};

export default Contact as React.FC;