import sanitizeHtml from 'sanitize-html';

/**
 * Rich text comes from the admin editor and is rendered as HTML on the public site, so it
 * is cleaned on the way in: scripts, event handlers and unknown embeds are stripped.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'h1', 'h2', 'figure', 'figcaption'],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      a: ['href', 'name', 'target', 'rel'],
      code: ['class'],
      pre: ['class'],
      span: ['class'],
      '*': ['id'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}
