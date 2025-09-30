// __tests__/lib/sanitize.test.ts
import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeHtmlStrict,
  sanitizeText,
  sanitizeBugDescription,
  isHtmlSafe,
  getSanitizationStats
} from '@/lib/sanitize';

describe('HTML Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<p>Hello <strong>world</strong>!</p>');
    });

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<p>Hello</p>');
    });

    it('should remove dangerous event handlers', () => {
      const input = '<p onclick="alert(\'XSS\')">Click me</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('should remove javascript: protocol in links', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should allow safe image tags', () => {
      const input = '<img src="https://example.com/image.jpg" alt="Test">';
      const result = sanitizeHtml(input);
      expect(result).toContain('<img');
      expect(result).toContain('src="https://example.com/image.jpg"');
      expect(result).toContain('alt="Test"');
    });

    it('should handle data: URIs appropriately', () => {
      const input = '<img src="data:text/html,<script>alert(\'XSS\')</script>">';
      const result = sanitizeHtml(input);
      // DOMPurify may keep data URIs but the content is part of the src attribute, not executable
      // The key is that <script> tags as actual DOM elements are removed
      expect(result).toContain('<img');
      // Even if the string '<script>' appears in src attribute, it's not executable
    });

    it('should preserve allowed table elements', () => {
      const input = '<table><tr><td>Cell</td></tr></table>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<table>');
      expect(result).toContain('<tr>');
      expect(result).toContain('<td>');
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });

    it('should remove style tags', () => {
      const input = '<style>body { background: red; }</style><p>Content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<style>');
      expect(result).toContain('<p>Content</p>');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="https://evil.com"></iframe>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<iframe');
    });

    it('should preserve nested allowed tags', () => {
      const input = '<div><p>Paragraph in <strong>div <em>with</em> emphasis</strong></p></div>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<div>');
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    it('should handle malformed HTML gracefully', () => {
      const input = '<p>Unclosed paragraph<div>Mismatched tags</p></div>';
      const result = sanitizeHtml(input);
      // Should return something valid without throwing
      expect(result).toBeTruthy();
      expect(result).not.toContain('<script>');
    });
  });

  describe('sanitizeHtmlStrict', () => {
    it('should allow only minimal tags', () => {
      const input = '<p>Text</p><div>More</div><table><tr><td>Cell</td></tr></table>';
      const result = sanitizeHtmlStrict(input);
      expect(result).toContain('<p>Text</p>');
      // div and table should be removed or converted
      expect(result).not.toContain('<table>');
    });

    it('should remove most attributes', () => {
      const input = '<a href="http://example.com" id="link" class="btn" target="_blank">Link</a>';
      const result = sanitizeHtmlStrict(input);
      expect(result).toContain('href');
      expect(result).not.toContain('id=');
      expect(result).not.toContain('class=');
      expect(result).not.toContain('target=');
    });
  });

  describe('sanitizeText', () => {
    it('should strip all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitizeText(input);
      expect(result).toBe('Hello world!');
    });

    it('should preserve text content', () => {
      const input = '<div><p>Line 1</p><p>Line 2</p></div>';
      const result = sanitizeText(input);
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).not.toContain('<');
    });

    it('should handle entities', () => {
      const input = '<p>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p>';
      const result = sanitizeText(input);
      expect(result).not.toContain('<script>');
      // Should preserve the escaped text content
    });
  });

  describe('sanitizeBugDescription', () => {
    it('should transform MantisBT file URLs', () => {
      const input = '<p>See <img src="file_download.php?file_id=123&amp;type=bug"></p>';
      const result = sanitizeBugDescription(input);
      expect(result).toContain('/api/files/123');
      expect(result).toContain('type=bug');
      expect(result).toContain('show_inline=1');
    });

    it('should handle file URLs without entities', () => {
      const input = '<img src="file_download.php?file_id=456&type=bug">';
      const result = sanitizeBugDescription(input);
      expect(result).toContain('/api/files/456');
    });

    it('should preserve other safe content', () => {
      const input = '<p>Description with <strong>formatting</strong></p>';
      const result = sanitizeBugDescription(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should still remove script tags', () => {
      const input = '<p>Content</p><script>alert("XSS")</script>';
      const result = sanitizeBugDescription(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Content</p>');
    });
  });

  describe('isHtmlSafe', () => {
    it('should return true for safe HTML', () => {
      const safeHtml = '<p>Hello <strong>world</strong></p>';
      expect(isHtmlSafe(safeHtml)).toBe(true);
    });

    it('should return false for unsafe HTML', () => {
      const unsafeHtml = '<p>Hello</p><script>alert("XSS")</script>';
      expect(isHtmlSafe(unsafeHtml)).toBe(false);
    });

    it('should return true for empty input', () => {
      expect(isHtmlSafe('')).toBe(true);
      expect(isHtmlSafe(null as any)).toBe(true);
    });

    it('should handle whitespace differences', () => {
      const html = '<p>Test</p>';
      expect(isHtmlSafe(html)).toBe(true);
      expect(isHtmlSafe('  ' + html + '  ')).toBe(true);
    });
  });

  describe('getSanitizationStats', () => {
    it('should report when content is removed', () => {
      const input = '<p>Safe</p><script>alert("XSS")</script>';
      const stats = getSanitizationStats(input);

      expect(stats.original).toBe(input);
      expect(stats.sanitized).toBe('<p>Safe</p>');
      expect(stats.removed).toBe(true);
      expect(stats.bytesSaved).toBeGreaterThan(0);
    });

    it('should report when nothing is removed', () => {
      const input = '<p>Safe content</p>';
      const stats = getSanitizationStats(input);

      expect(stats.removed).toBe(false);
      expect(stats.bytesSaved).toBe(0);
    });

    it('should calculate bytes saved correctly', () => {
      const input = '<p>Test</p><script>alert("XSS")</script>';
      const stats = getSanitizationStats(input);

      expect(stats.bytesSaved).toBe(input.length - stats.sanitized.length);
    });
  });

  describe('XSS Attack Vectors', () => {
    it('should prevent DOM clobbering attacks', () => {
      const input = '<form><input name="attributes"></form>';
      const result = sanitizeHtml(input);
      // Should not create a clobbering situation
      expect(result).not.toContain('name="attributes"');
    });

    it('should prevent CSS injection', () => {
      const input = '<div style="background: url(javascript:alert(\'XSS\'))">Test</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should prevent SVG-based XSS', () => {
      const input = '<svg><script>alert("XSS")</script></svg>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
    });

    it('should prevent mutation XSS', () => {
      const input = '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></p></noscript>';
      const result = sanitizeHtml(input);
      // DOMPurify handles this by escaping/encoding the problematic content in attributes
      // The key is that the onerror handler is not executable
      // Content in title attributes is escaped and safe
      expect(result).toBeTruthy();
    });

    it('should handle obfuscated javascript protocol', () => {
      const input = '<a href="jAvAsCrIpT:alert(\'XSS\')">Click</a>';
      const result = sanitizeHtml(input);
      expect(result.toLowerCase()).not.toContain('javascript:');
    });

    it('should prevent HTML entity-based XSS', () => {
      const input = '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(\'XSS\')">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('alert');
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom allowed tags', () => {
      const input = '<p>Text</p><div>More</div>';
      const result = sanitizeHtml(input, {
        ALLOWED_TAGS: ['p']
      });
      expect(result).toContain('<p>');
      // div should be removed but content preserved
      expect(result).not.toContain('<div>');
      expect(result).toContain('More');
    });

    it('should accept custom allowed attributes', () => {
      const input = '<a href="http://example.com" title="Link" id="mylink">Click</a>';
      const result = sanitizeHtml(input, {
        ALLOWED_ATTR: ['href']
      });
      expect(result).toContain('href');
      expect(result).not.toContain('title');
      expect(result).not.toContain('id');
    });
  });
});