import { escapeHtml, sanitizeUrl, sanitizeColor, sanitizeCssValue } from '../src/utils/sanitize';

describe('escapeHtml', () => {
  test('escapes all dangerous characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  test('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  test('escapes backticks and single quotes', () => {
    expect(escapeHtml("`'")).toBe('&#x60;&#x27;');
  });

  test('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  test('passes through safe text unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });
});

describe('sanitizeUrl', () => {
  test('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  test('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  test('allows relative URLs starting with /', () => {
    expect(sanitizeUrl('/privacy')).toBe('/privacy');
  });

  test('allows relative URLs starting with ./', () => {
    expect(sanitizeUrl('./privacy.html')).toBe('./privacy.html');
  });

  test('blocks javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  test('blocks data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  test('blocks empty string', () => {
    expect(sanitizeUrl('')).toBe('');
  });

  test('trims whitespace', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
  });

  test('escapes HTML entities in URLs', () => {
    expect(sanitizeUrl('https://example.com?a=1&b=2')).toBe(
      'https://example.com?a=1&amp;b=2'
    );
  });
});

describe('sanitizeColor', () => {
  test('allows 3-digit hex', () => {
    expect(sanitizeColor('#fff')).toBe('#fff');
  });

  test('allows 6-digit hex', () => {
    expect(sanitizeColor('#ff00aa')).toBe('#ff00aa');
  });

  test('allows 8-digit hex (with alpha)', () => {
    expect(sanitizeColor('#ff00aacc')).toBe('#ff00aacc');
  });

  test('allows rgb()', () => {
    expect(sanitizeColor('rgb(255, 0, 128)')).toBe('rgb(255, 0, 128)');
  });

  test('allows rgba()', () => {
    expect(sanitizeColor('rgba(255, 0, 128, 0.5)')).toBe('rgba(255, 0, 128, 0.5)');
  });

  test('allows hsl()', () => {
    expect(sanitizeColor('hsl(120, 50%, 50%)')).toBe('hsl(120, 50%, 50%)');
  });

  test('allows named colors', () => {
    expect(sanitizeColor('red')).toBe('red');
    expect(sanitizeColor('blue')).toBe('blue');
    expect(sanitizeColor('tomato')).toBe('tomato');
  });

  test('blocks CSS keywords: inherit', () => {
    expect(sanitizeColor('inherit')).toBe('');
  });

  test('blocks CSS keywords: initial', () => {
    expect(sanitizeColor('initial')).toBe('');
  });

  test('blocks CSS keywords: unset', () => {
    expect(sanitizeColor('unset')).toBe('');
  });

  test('blocks CSS keywords: revert', () => {
    expect(sanitizeColor('revert')).toBe('');
  });

  test('blocks CSS keywords: revert-layer', () => {
    expect(sanitizeColor('revert-layer')).toBe('');
  });

  test('blocks expressions with url()', () => {
    expect(sanitizeColor('url(evil.com)')).toBe('');
  });

  test('blocks values with semicolons', () => {
    expect(sanitizeColor('#fff; background: red')).toBe('');
  });

  test('trims whitespace', () => {
    expect(sanitizeColor('  #abc  ')).toBe('#abc');
  });

  test('blocks empty string', () => {
    expect(sanitizeColor('')).toBe('');
  });
});

describe('sanitizeCssValue', () => {
  test('strips semicolons and braces', () => {
    expect(sanitizeCssValue('value; evil{}')).toBe('value evil');
  });

  test('strips url() calls', () => {
    const result = sanitizeCssValue('url(evil.js)');
    expect(result).not.toContain('url(');
    expect(result).not.toContain('url ');
  });

  test('returns clean values unchanged', () => {
    expect(sanitizeCssValue('12px')).toBe('12px');
  });
});
