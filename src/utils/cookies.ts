/**
 * Cookie utilities for clearing non-essential cookies on rejection/withdrawal
 */

/** Known analytics cookie name patterns */
const ANALYTICS_COOKIE_PATTERNS = [
  /^_ga/,       // Google Analytics
  /^_gid/,      // Google Analytics
  /^_gat/,      // Google Analytics
  /^_gcl/,      // Google Ads conversion linker
  /^_hj/,       // Hotjar
  /^_pk_/,      // Matomo/Piwik
  /^mp_/,       // Mixpanel
  /^ajs_/,      // Segment
  /^amplitude/, // Amplitude
  /^plausible/, // Plausible
];

/** Known marketing cookie name patterns */
const MARKETING_COOKIE_PATTERNS = [
  /^_fbp/,      // Facebook Pixel
  /^_fbc/,      // Facebook click
  /^fr$/,       // Facebook
  /^_pin_/,     // Pinterest
  /^_tt_/,      // TikTok
  /^li_/,       // LinkedIn
  /^_uet/,      // Microsoft/Bing Ads
  /^IDE$/,      // DoubleClick
  /^test_cookie/, // DoubleClick
  /^MUID$/,     // Microsoft
  /^NID$/,      // Google Ads
];

/** Known preferences cookie name patterns */
const PREFERENCES_COOKIE_PATTERNS = [
  /^lang$/,
  /^locale$/,
  /^i18n/,
];

const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  analytics: ANALYTICS_COOKIE_PATTERNS,
  marketing: MARKETING_COOKIE_PATTERNS,
  preferences: PREFERENCES_COOKIE_PATTERNS,
};

/**
 * Get all cookies as name/value pairs
 */
function getAllCookies(): string[] {
  return document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(Boolean);
}

/**
 * Delete a cookie by name, trying all common path/domain combinations
 */
function deleteCookie(name: string): void {
  const hostname = window.location.hostname;
  const paths = ['/', window.location.pathname];

  // Build domain variants: current domain + parent domains
  const domains = ['', hostname];
  const parts = hostname.split('.');
  if (parts.length > 2) {
    // Add parent domain (e.g., .example.com for sub.example.com)
    domains.push('.' + parts.slice(-2).join('.'));
  }
  domains.push('.' + hostname);

  for (const domain of domains) {
    for (const path of paths) {
      const domainPart = domain ? `; domain=${domain}` : '';
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}; secure`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}; samesite=lax`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}; samesite=none; secure`;
    }
  }
}

/**
 * Clear cookies matching patterns for denied categories
 */
export function clearCookiesForCategory(category: string): void {
  const patterns = CATEGORY_PATTERNS[category];
  if (!patterns) return;

  const cookies = getAllCookies();
  for (const name of cookies) {
    if (patterns.some(pattern => pattern.test(name))) {
      deleteCookie(name);
    }
  }
}

/**
 * Clear all non-essential cookies based on consent categories
 */
export function clearDeniedCookies(categories: Record<string, boolean>): void {
  for (const [category, allowed] of Object.entries(categories)) {
    if (!allowed && category !== 'necessary') {
      clearCookiesForCategory(category);
    }
  }
}
