import { useEffect, useState } from "react";

export default function() {
  useEffect(init, []); // empty array means executing only once

  const [disabledVoices, setDisabledVoices] = useState<string[]>();

  function init() {
    const port = chrome.runtime.connect();
    port.postMessage({ action: "getDisabledVoices" });
    port.onMessage.addListener(message => {
      if (message.action == "updateDisabledVoices") {
        setDisabledVoices(message.disabledVoices);
      }
    });
  }

  return disabledVoices;
}