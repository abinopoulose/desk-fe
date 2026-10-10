/**
 * Extracts tenant subdomain from the current window hostname.
 * Examples:
 * - "abino.localhost" -> "abino"
 * - "tenant1.desk.example.com" -> "tenant1"
 * - "localhost" -> null
 * - "127.0.0.1" -> null
 */
export function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length > 1) {
    const sub = parts[0].toLowerCase();
    if (sub !== 'www' && sub !== 'localhost' && sub !== '127') {
      return sub;
    }
  }
  return null;
}
