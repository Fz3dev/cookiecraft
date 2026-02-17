/**
 * Normalize any supported color format to 6-digit hex
 * Supports: #RGB, #RRGGBB, #RRGGBBAA, named colors
 * Returns null if conversion fails
 */
function normalizeToHex6(color: string): string | null {
  const trimmed = color.trim();

  // Already 6-digit hex
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }

  // 3-digit hex → expand to 6-digit
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  // 8-digit hex (with alpha) → strip alpha
  if (/^#[0-9a-fA-F]{8}$/.test(trimmed)) {
    return trimmed.substring(0, 7);
  }

  return null;
}

/**
 * Adjust a hex color brightness by a percentage
 * Negative = darker, positive = lighter
 */
export function adjustColorBrightness(color: string, percent: number): string {
  const hex6 = normalizeToHex6(color);
  if (!hex6) return color;

  const hex = hex6.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const adjust = (value: number) => {
    const adjusted = value + (value * percent / 100);
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  const toHex = (value: number) => {
    const h = value.toString(16);
    return h.length === 1 ? '0' + h : h;
  };

  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

/**
 * Build inline CSS custom properties for a primary color
 */
export function buildColorStyle(safeColor: string): string {
  if (!safeColor) return '';

  // Only generate hover color for hex colors
  const hex6 = normalizeToHex6(safeColor);
  if (!hex6) {
    return `--cc-primary: ${safeColor};`;
  }

  const hover = adjustColorBrightness(hex6, -15);
  return `--cc-primary: ${hex6}; --cc-primary-hover: ${hover};`;
}
