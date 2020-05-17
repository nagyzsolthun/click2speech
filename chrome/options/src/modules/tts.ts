import { useEffect, useState } from "react";

export default function() {
  useEffect(init, []); // empty array means executing only once

  const [voices, setVoices] = useState<{name: string, lan: string}[]>();

  function init() {
    const port = chrome.runtime.connect();
    port.postMessage("getVoices");
    port.onMessage.addListener(message => {
      const voices = message.voices;
      if(voices !== undefined) {
        setVoices(voices)
      }
    });
  }

  return voices;
}