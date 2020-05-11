import { useState, useEffect } from "react";

const cache = new Map<string, any>(Object.entries({
  speed: 1.2,
  preferredVoice: "VoiceName1",
  hoverSelect: true,
  arrowSelect: false,
  browserSelect: false,
}));

function useMemoryStorage<T>(key: string, defaultValue?: T): [T | undefined, (value:T) => void] {
  useEffect(init, []); // empty array means executing only once

  const [value, setValue] = useState<T>();

  function updateStore(value: T): void {
    cache.set(key, value);
    setValue(value);
  }

  function init() {
    setValue(cache.get(key) as T);
  }

  return [value, updateStore];
}

export default useMemoryStorage;