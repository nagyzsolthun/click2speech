import { useEffect, useState } from "react";
import { browser } from "webextension-polyfill-ts"

export default function() {
  useEffect(init, []); // empty array means executing only once

  const [voices, setVoices] = useState<{name: string, lan: string}[]>();

  function init() {
    browser.runtime.sendMessage("getVoices").then(voices => setVoices(voices));
  }

  return voices;
}