import { useEffect, useState } from "react";

function useReviewsUrl() {
  useEffect(init, []); // empty array means executing only once
  const [reviewsUrl, setReviewsUrl] = useState<string>();
  function init() {
    setReviewsUrl("https://github.com/nagyzsolthun");
  }
  return reviewsUrl;
}

function useEmail() {
  useEffect(init, []); // empty array means executing only once
  const [email, setEmail] = useState<string>();
  const [emailUrl, setEmailUrl] = useState<string>();
  function init() {
    setEmail("email@email.com");
    setEmailUrl("https://github.com/nagyzsolthun");
  }
  return [email, emailUrl];
}

export { useReviewsUrl, useEmail }