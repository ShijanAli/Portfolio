const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes user-provided text before it is placed into an HTML email. */
export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
