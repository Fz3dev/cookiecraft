/**
 * Adjust a hex color brightness by a percentage
 * Negative = darker, positive = lighter
 */
export function adjustColorBrightness(color: string, percent: number): string {
  const hex = color.replace('#', '');
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
  const hover = adjustColorBrightness(safeColor, -15);
  return `--cc-primary: ${safeColor}; --cc-primary-hover: ${hover};`;
}
