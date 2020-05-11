import { useState, useEffect } from "react";

function useStorage<T>(key: string): [T | undefined, (value:T) => void] {
  useEffect(init, []); // empty array means executing only once

  const [value, setValue] = useState<T>();

  function updateStore(value: T): void {
    const items = {[key]: value};
    chrome.storage.local.set(items);  // onStorageChange will be called
  }

  function init() {
    chrome.storage.local.get(key, items => setValue(items[key] as T));
    chrome.storage.onChanged.addListener(onStorageChange);
    return cleanUp;
  }

  function onStorageChange(changes: { [key: string]: chrome.storage.StorageChange }) {
    if(key in changes) {
      const value = changes[key].newValue as T;
      setValue(value);
    }
  }

  function cleanUp() {
    chrome.storage.onChanged.removeListener(onStorageChange);
  }

  return [value, updateStore];
}

export default useStorage;