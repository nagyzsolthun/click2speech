import { useEffect, useState } from "react";

export default function() {
  useEffect(init, []); // empty array means executing only once

  const [voices, setVoices] = useState<{name: string, lan: string}[]>();

  function init() {
    const port = chrome.runtime.connect();
    port.postMessage({ action: "getVoices" });
    port.onMessage.addListener(message => {
      if (message.action === "updateVoices") {
        setVoices(message.voices);
      }
    });
  }

  return voices;
}