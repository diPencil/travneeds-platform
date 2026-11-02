/**
 * TravNeeds Modular Platform — Safe HTML Sanitizer & Plain Text Converter
 *
 * Implements strict reader-first security for narrative fields:
 * - Tour Overview
 * - Itinerary day/stop descriptions
 * - Itinerary Note
 *
 * Allowed tags: p, br, b, strong, i, em, u, h2, h3, ul, ol, li, a
 * Allowed attributes: a[href, target, rel], p[style] (only text-align: left|center|right), h2/h3[style]
 * Rejects javascript:, data:, vbscript: URIs.
 * Never silently truncates user content.
 * Strips HTML tags cleanly for plain text exports, PDFs, and JSON-LD structured data.
 */

import sanitizeHtml from 'sanitize-html';

export const ALLOWED_RICH_TEXT_TAGS = [
  'p',
  'br',
  'b',
  'strong',
  'i',
  'em',
  'u',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'a',
];

export const SANITIZER_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_RICH_TEXT_TAGS,
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    p: ['style', 'dir'],
    h2: ['style', 'dir'],
    h3: ['style', 'dir'],
    span: ['style', 'dir'],
  },
  allowedStyles: {
    '*': {
      'text-align': [/^left$/, /^center$/, /^right$/, /^justify$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href || '';
      // Ensure target="_blank" always has rel="noopener noreferrer"
      if (attribs.target === '_blank') {
        attribs.rel = 'noopener noreferrer';
      }
      return {
        tagName: 'a',
        attribs,
      };
    },
  },
};

/**
 * Sanitizes an untrusted HTML string. Returns safe restricted HTML-v1.
 */
export function sanitizeRichText(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';
  const trimmed = dirtyHtml.trim();
  if (!trimmed) return '';

  return sanitizeHtml(trimmed, SANITIZER_CONFIG);
}

/**
 * Detects whether a string is HTML or plain text.
 */
export function isHtmlContent(content: string | null | undefined): boolean {
  if (!content || typeof content !== 'string') return false;
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

/**
 * Strips all HTML tags and returns clean plain text.
 * Used for PDF generation, download text, and SEO JSON-LD schemas.
 */
export function stripHtmlToPlainText(htmlOrText: string | null | undefined): string {
  if (!htmlOrText || typeof htmlOrText !== 'string') return '';
  if (!isHtmlContent(htmlOrText)) return htmlOrText.trim();

  return sanitizeHtml(htmlOrText, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

