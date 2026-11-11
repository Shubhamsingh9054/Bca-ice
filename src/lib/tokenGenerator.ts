/**
 * BCA Ice Cream Wala - Unique Token Generator
 * Produces prominent, sequential-looking unique pickup tokens: e.g. BCA-0879
 */

const TOKEN_STORAGE_KEY = 'bca_icecream_last_token_seq';
const STARTING_SEQ = 878; // Next one will be 879 -> BCA-0879

export function getNextTokenNumber(existingOrdersCount = 0): string {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    let nextSeq = stored ? parseInt(stored, 10) + 1 : STARTING_SEQ + 1 + existingOrdersCount;
    if (isNaN(nextSeq) || nextSeq < 879) {
      nextSeq = 879;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, nextSeq.toString());
    const padded = nextSeq.toString().padStart(4, '0');
    return `BCA-${padded}`;
  } catch {
    const randomSuffix = Math.floor(879 + Math.random() * 9000);
    return `BCA-${randomSuffix.toString().padStart(4, '0')}`;
  }
}

/**
 * Validates whether a given token matches the BCA token pattern (e.g. BCA-0879)
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token) return false;
  const clean = token.trim().toUpperCase();
  return /^BCA-\d{4,}$/.test(clean);
}

/**
 * Formats user token input automatically (e.g. "879" -> "BCA-0879")
 */
export function normalizeTokenInput(raw: string): string {
  if (!raw) return '';
  const clean = raw.trim().toUpperCase();
  if (clean.startsWith('BCA-')) {
    return clean;
  }
  if (clean.startsWith('BCA')) {
    return `BCA-${clean.slice(3).replace(/^-+/, '')}`;
  }
  // If user only typed digits like "0879" or "879"
  if (/^\d+$/.test(clean)) {
    return `BCA-${clean.padStart(4, '0')}`;
  }
  return clean;
}
