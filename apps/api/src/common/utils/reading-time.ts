const WORDS_PER_MINUTE = 200;

/** Estimated minutes to read rich text (HTML tags are ignored). */
export function readingTime(html: string): number {
  const words = html
    .replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
