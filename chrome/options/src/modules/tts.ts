import { useEffect, useState } from "react";
import browser from "webextension-polyfill"

export default function() {
  useEffect(init, []); // empty array means executing only once

  const [voices, setVoices] = useState<{name: string, lan: string}[]>();

  function init() {
    browser.runtime.sendMessage<string, {name: string, lan: string}[]>("getVoices").then(voices => setVoices(voices));
  }

  return voices;
}