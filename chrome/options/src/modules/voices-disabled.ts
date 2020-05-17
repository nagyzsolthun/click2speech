import { useEffect, useState } from "react";

export default function() {
  useEffect(init, []); // empty array means executing only once

  const [disabledVoices, setDisabledVoices] = useState<string[]>();

  function init() {
    const port = chrome.runtime.connect();
    port.postMessage("getDisabledVoices");
    port.onMessage.addListener(message => {
      const disabledVoices = message.disabledVoices;
      if(disabledVoices !== undefined) {
        setDisabledVoices(disabledVoices)
      }
    });
  }

  return disabledVoices;
}