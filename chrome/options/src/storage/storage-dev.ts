import { useState } from "react";

function useMemoryStorage<T>(key: string): [T | undefined, (value:T) => void] {
  return useState<T>();
}

export default useMemoryStorage;