import { DEFAULT_STATE } from '../types/index';
import type { AppState } from '../types/index';

export const STORAGE_KEY = 'todoodle_state';

/**
 * Reads AppState from localStorage.
 * Returns DEFAULT_STATE if key is absent or value is invalid JSON.
 * Never throws.
 */
export function readState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_STATE;
    return JSON.parse(raw) as AppState;
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Serializes state to localStorage under STORAGE_KEY.
 * Silently catches QuotaExceededError to avoid crashing on storage limits.
 */
export function writeState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[Todoodle] Failed to persist state:', e);
  }
}
