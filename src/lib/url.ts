/**
 * Nominees type links the way people actually do — "www.rareindia.com",
 * "rareindia.com/sustainability" — so a bare `.url()` check rejects perfectly
 * good input. Normalise first: add https:// when a scheme is missing but the
 * value clearly looks like a host.
 *
 * Returns "" for blank input, and hands anything unrecognisable back untouched
 * so validation can still reject genuine nonsense.
 */
const HAS_SCHEME = /^[a-z][a-z0-9+.\-]*:\/\//i;
// host.tld, optionally with more labels, port, path, query or fragment
const LOOKS_LIKE_HOST =
  /^[\w-]+(\.[\w-]+)+(:\d+)?([/?#].*)?$/;

export function normalizeUrl(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const s = value.trim();
  if (!s) return "";
  if (HAS_SCHEME.test(s)) return s;
  // a lone "mailto:x" or similar scheme-less oddity is left for validation
  if (LOOKS_LIKE_HOST.test(s)) return `https://${s}`;
  return s;
}
