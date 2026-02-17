/**
 * Sanitization utilities to prevent XSS in HTML templates
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
};

const HTML_ESCAPE_RE = /[&<>"'`]/g;

/**
 * Escape HTML entities in a string to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str.replace(HTML_ESCAPE_RE, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Sanitize a URL - only allow http(s) and relative URLs
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  ) {
    return escapeHtml(trimmed);
  }
  return '';
}

/**
 * Sanitize a CSS color value - only allow valid hex, rgb, hsl, named colors
 */
export function sanitizeColor(color: string): string {
  const trimmed = color.trim();
  // Allow hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  // Allow rgb/rgba
  if (/^rgba?\(\s*[\d\s,./%]+\)$/.test(trimmed)) return trimmed;
  // Allow hsl/hsla
  if (/^hsla?\(\s*[\d\s,./%deg]+\)$/.test(trimmed)) return trimmed;
  // Allow CSS named colors (basic set)
  if (/^[a-zA-Z]+$/.test(trimmed)) return trimmed;
  return '';
}

/**
 * Sanitize a CSS property value to prevent injection
 */
export function sanitizeCssValue(value: string): string {
  // Strip anything that could break out of CSS context
  return value.replace(/[;{}]/g, '').replace(/url\s*\(/gi, '').trim();
}
