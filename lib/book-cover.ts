/** Normalize ISBN to 10 or 13 chars (digits + X); null if invalid. */
export function normalizeIsbnDigits(isbn: string): string | null {
  const digits = isbn.replace(/[^0-9X]/gi, "").toUpperCase();
  if (digits.length !== 10 && digits.length !== 13) return null;
  return digits;
}

/**
 * Whether an ISBN string can be used for Open Library covers (client uses
 * `/api/book-cover?isbn=…` so the server can resolve cover id + set User-Agent).
 */
export function isbnHasOpenLibraryCover(isbn: string): boolean {
  return normalizeIsbnDigits(isbn) !== null;
}
