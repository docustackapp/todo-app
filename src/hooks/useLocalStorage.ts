import { useState, useCallback } from 'react';

/**
 * Generic hook for reading and writing a value to localStorage.
 *
 * Implements the read-before-write pattern: when the setter is called,
 * it first reads the current value from localStorage (so concurrent
 * updates from sibling hooks using the same key are not lost), applies
 * the update, then persists the new value.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (updater: T | ((prev: T) => T)) => void] {
  const readFromStorage = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue]);

  const [state, setState] = useState<T>(readFromStorage);

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      // Read-before-write: read the current stored value before applying the update
      const current = readFromStorage();
      const newValue =
        typeof updater === 'function'
          ? (updater as (prev: T) => T)(current)
          : updater;

      setState(newValue);
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (e) {
        console.warn('[Todoodle] Failed to persist state:', e);
      }
    },
    [key, readFromStorage],
  );

  return [state, setValue];
}
