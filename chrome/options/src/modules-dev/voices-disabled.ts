import { useEffect, useState } from "react";

export default function() {
  useEffect(init, []); // empty array means executing only once

  const [disabledVoices, setDisabledVoices] = useState<string[]>();

  function init() {
    setDisabledVoices(["VoiceName3"]);
  }

  return disabledVoices;
}