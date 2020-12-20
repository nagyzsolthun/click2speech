import { useEffect, useState } from "react";
import { browser } from "webextension-polyfill-ts"

export default function() {
  useEffect(init, []); // empty array means executing only once

  const [disabledVoices, setDisabledVoices] = useState<string[]>();

  function init() {
    browser.runtime.sendMessage("getDisabledVoices").then(disabledVoices => setDisabledVoices(disabledVoices));
  }

  return disabledVoices;
}