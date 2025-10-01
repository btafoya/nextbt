// /lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";
import { logger } from "@/lib/logger";

/**
 * HTML Sanitization Configuration
 *
 * Prevents XSS attacks by sanitizing user-generated HTML content
 * before rendering with dangerouslySetInnerHTML.
 *
 * Based on OWASP recommendations for HTML sanitization.
 */

/**
 * Default sanitization configuration for MantisBT content
 * Allows common formatting tags while blocking dangerous elements
 */
const DEFAULT_CONFIG = {
  // Allowed HTML tags (MantisBT standard formatting)
  ALLOWED_TAGS: [
    // Text formatting
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
    'sup', 'sub', 'small', 'mark', 'abbr', 'code', 'pre', 'kbd', 'samp',

    // Structure
    'div', 'span', 'blockquote', 'hr',

    // Lists
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',

    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',

    // Links and media
    'a', 'img',

    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ],

  // Allowed attributes
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id',
    'width', 'height', 'align', 'valign',
    'colspan', 'rowspan', 'border', 'cellpadding', 'cellspacing',
    'target', 'rel' // For links
  ],

  // Additional security settings
  ALLOW_DATA_ATTR: false, // Prevent data-* attributes
  ALLOW_UNKNOWN_PROTOCOLS: false, // Only allow safe protocols
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  SAFE_FOR_TEMPLATES: true, // Prevent template injection
  WHOLE_DOCUMENT: false, // Only sanitize fragment, not full document
  RETURN_DOM: false, // Return string, not DOM
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  FORCE_BODY: false, // Don't wrap in <body>
  SANITIZE_DOM: true, // Remove DOM clobbering attacks
  KEEP_CONTENT: true, // Keep content of removed tags (extract text)
  IN_PLACE: false, // Don't modify input directly
};

/**
 * Sanitize HTML content for safe rendering
 *
 * @param html - Raw HTML string to sanitize
 * @param config - Optional DOMPurify configuration (merges with defaults)
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```typescript
 * const userInput = '<p>Hello</p><script>alert("XSS")</script>';
 * const safe = sanitizeHtml(userInput);
 * // Returns: '<p>Hello</p>' (script tag removed)
 * ```
 */
export function sanitizeHtml(html: string, config?: any): string {
  if (!html) return '';

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    return DOMPurify.sanitize(html, mergedConfig) as unknown as string;
  } catch (error) {
    logger.error('HTML sanitization error:', error);
    // Return empty string on error for safety
    return '';
  }
}

/**
 * Strict sanitization for untrusted content
 * Minimal allowed tags for maximum security
 *
 * Use when displaying content from external sources or
 * when security is paramount over formatting preservation.
 *
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML with minimal formatting
 */
export function sanitizeHtmlStrict(html: string): string {
  return sanitizeHtml(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'code'],
    ALLOWED_ATTR: ['href', 'title']
  });
}

/**
 * Sanitize plain text by stripping all HTML tags
 * Returns plain text content only
 *
 * @param html - HTML string to convert to plain text
 * @returns Plain text with all HTML removed
 *
 * @example
 * ```typescript
 * const html = '<p>Hello <strong>world</strong>!</p>';
 * const text = sanitizeText(html);
 * // Returns: 'Hello world!'
 * ```
 */
export function sanitizeText(html: string): string {
  return sanitizeHtml(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

/**
 * Sanitize HTML content specifically for MantisBT bug descriptions
 * Allows MantisBT-specific formatting including tables and code blocks
 *
 * @param html - MantisBT bug description HTML
 * @returns Sanitized HTML preserving MantisBT formatting
 */
export function sanitizeBugDescription(html: string): string {
  // Transform MantisBT file_download.php URLs before sanitization
  // This preserves internal file references while sanitizing everything else
  const transformedHtml = html.replace(
    /file_download\.php\?file_id=(\d+)(?:&amp;|&)type=(\w+)/g,
    '/api/files/$1?type=$2&show_inline=1'
  );

  return sanitizeHtml(transformedHtml, {
    ...DEFAULT_CONFIG,
    // Add target="_blank" and rel="noopener noreferrer" to external links
    ADD_ATTR: ['target', 'rel'],
    ALLOWED_ATTR: [...(DEFAULT_CONFIG.ALLOWED_ATTR || []), 'target', 'rel']
  });
}

/**
 * Validate if HTML content is safe without modifying it
 * Returns true if content is already safe, false if it contains dangerous elements
 *
 * @param html - HTML string to validate
 * @returns true if HTML is safe, false if it contains dangerous content
 */
export function isHtmlSafe(html: string): boolean {
  if (!html) return true;

  const sanitized = sanitizeHtml(html);
  // Compare sanitized version with original (normalized whitespace)
  return sanitized.trim() === html.trim();
}

/**
 * Get sanitization statistics for debugging
 * Shows what was removed during sanitization
 *
 * @param html - HTML string to analyze
 * @returns Object with sanitization statistics
 */
export function getSanitizationStats(html: string): {
  original: string;
  sanitized: string;
  removed: boolean;
  bytesSaved: number;
} {
  const sanitized = sanitizeHtml(html);
  const removed = sanitized.length !== html.length;
  const bytesSaved = html.length - sanitized.length;

  return {
    original: html,
    sanitized,
    removed,
    bytesSaved
  };
}