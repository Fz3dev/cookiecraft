/**
 * Sanitization utilities to prevent XSS in HTML templates
 */
/**
 * Escape HTML entities in a string to prevent XSS
 */
export declare function escapeHtml(str: string): string;
/**
 * Sanitize a URL - only allow http(s) and relative URLs
 */
export declare function sanitizeUrl(url: string): string;
/**
 * Sanitize a CSS color value - only allow valid hex, rgb, hsl, named colors
 */
export declare function sanitizeColor(color: string): string;
/**
 * Sanitize a CSS property value to prevent injection
 */
export declare function sanitizeCssValue(value: string): string;
