/**
 * localStorage that never throws: private windows, blocked cookies and full
 * quotas just mean nothing is remembered.
 */
export function readStorage(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Not remembering is acceptable.
  }
}

export function removeStorage(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // Nothing to clean up.
  }
}
