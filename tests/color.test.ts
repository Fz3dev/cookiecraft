import { adjustColorBrightness, buildColorStyle } from '../src/utils/color';

describe('adjustColorBrightness', () => {
  test('darkens a color with negative percent', () => {
    // #ffffff darkened by -50% → each channel: 255 + (255 * -50 / 100) = 127.5 → 128
    const result = adjustColorBrightness('#ffffff', -50);
    expect(result).toBe('#808080');
  });

  test('lightens a color with positive percent', () => {
    // #808080 = 128,128,128 lightened by 50% → 128 + 64 = 192 = #c0c0c0
    const result = adjustColorBrightness('#808080', 50);
    expect(result).toBe('#c0c0c0');
  });

  test('clamps to 0 (no negative channel values)', () => {
    const result = adjustColorBrightness('#010101', -200);
    expect(result).toBe('#000000');
  });

  test('clamps to 255 (no overflow)', () => {
    const result = adjustColorBrightness('#fefefe', 200);
    expect(result).toBe('#ffffff');
  });

  test('handles 3-digit hex', () => {
    // #fff → #ffffff → darken by 0% → #ffffff
    const result = adjustColorBrightness('#fff', 0);
    expect(result).toBe('#ffffff');
  });

  test('handles 8-digit hex (strips alpha)', () => {
    // #ffffffcc → #ffffff → darken by 0% → #ffffff
    const result = adjustColorBrightness('#ffffffcc', 0);
    expect(result).toBe('#ffffff');
  });

  test('returns original for non-hex input', () => {
    expect(adjustColorBrightness('rgb(255,0,0)', -10)).toBe('rgb(255,0,0)');
    expect(adjustColorBrightness('red', -10)).toBe('red');
  });

  test('0% change returns same color', () => {
    expect(adjustColorBrightness('#abcdef', 0)).toBe('#abcdef');
  });
});

describe('buildColorStyle', () => {
  test('returns empty string for empty input', () => {
    expect(buildColorStyle('')).toBe('');
  });

  test('returns primary + hover for hex color', () => {
    const result = buildColorStyle('#336699');
    expect(result).toContain('--cc-primary: #336699');
    expect(result).toContain('--cc-primary-hover:');
  });

  test('returns only primary for non-hex color', () => {
    const result = buildColorStyle('rgb(51, 102, 153)');
    expect(result).toBe('--cc-primary: rgb(51, 102, 153);');
    expect(result).not.toContain('--cc-primary-hover');
  });

  test('handles 3-digit hex', () => {
    const result = buildColorStyle('#369');
    expect(result).toContain('--cc-primary: #336699');
    expect(result).toContain('--cc-primary-hover:');
  });
});
