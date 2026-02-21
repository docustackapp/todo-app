/**
 * Generates a UUID v4 using the Web Crypto API.
 * Requires Chrome 92+, Firefox 95+, Safari 15.4+.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
