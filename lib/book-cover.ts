/** Open Library cover by ISBN (10 or 13 digits). Returns null if invalid. */
export function openLibraryIsbnCoverUrl(isbn: string): string | null {
  const digits = isbn.replace(/[^0-9X]/gi, "");
  if (digits.length !== 10 && digits.length !== 13) return null;
  return `https://covers.openlibrary.org/b/isbn/${digits}-M.jpg`;
}
