import { useState, useEffect } from "react";

export default function useVocies() {
  useEffect(init, []); // empty array means executing only once

  const [voices, setVoices] = useState<{name: string, lan: string}[]>();

  function init() {
    setVoices([
      {name: "VoiceName1", lan: "en-US"},
      {name: "VoiceName2", lan: "en-US"},
      {name: "VoiceName3", lan: "es-ES"},
      {name: "VoiceName4", lan: "es-ES"}
    ]);
  }
  
  return voices;
}