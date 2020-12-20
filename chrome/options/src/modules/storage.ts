import { useState, useEffect } from "react";
import { browser, Storage } from "webextension-polyfill-ts"

function useStorage<T>(key: string): [T | undefined, (value:T) => void] {
  useEffect(init, []); // empty array means executing only once

  const [value, setValue] = useState<T>();

  function updateStore(value: T): void {
    const items = {[key]: value};
    browser.storage.local.set(items);  // onStorageChange will be called
  }

  function init() {
    browser.storage.local.get(key).then(items => setValue(items[key] as T));
    browser.storage.onChanged.addListener(onStorageChange);
    return cleanUp;
  }

  function onStorageChange(changes: { [key: string]: Storage.StorageChange }) {
    if(key in changes) {
      const value = changes[key].newValue as T;
      setValue(value);
    }
  }

  function cleanUp() {
    browser.storage.onChanged.removeListener(onStorageChange);
  }

  return [value, updateStore];
}

export default useStorage;