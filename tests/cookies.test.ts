import { clearDeniedCookies, clearCookiesForCategory } from '../src/utils/cookies';

describe('clearDeniedCookies', () => {
  beforeEach(() => {
    // Clear all cookies in jsdom
    document.cookie.split(';').forEach(c => {
      const name = c.trim().split('=')[0];
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  });

  test('does not throw when called with empty categories', () => {
    expect(() => clearDeniedCookies({})).not.toThrow();
  });

  test('does not throw with all allowed categories', () => {
    expect(() => clearDeniedCookies({ necessary: true, analytics: true, marketing: true })).not.toThrow();
  });

  test('attempts to clear analytics cookies when analytics is denied', () => {
    // Set an analytics-pattern cookie
    document.cookie = '_ga=GA1.1.12345; path=/';

    clearDeniedCookies({ necessary: true, analytics: false, marketing: true });

    // After clearing, _ga should no longer be in cookies
    const cookies = document.cookie;
    expect(cookies).not.toContain('_ga=GA1.1.12345');
  });

  test('does not clear cookies for allowed categories', () => {
    document.cookie = '_ga=GA1.1.12345; path=/';

    clearDeniedCookies({ necessary: true, analytics: true, marketing: false });

    // _ga should still be there since analytics is allowed
    expect(document.cookie).toContain('_ga');
  });

  test('clearCookiesForCategory does nothing for unknown category', () => {
    document.cookie = '_ga=GA1.1.12345; path=/';

    clearCookiesForCategory('unknown_cat');

    // _ga should still be there
    expect(document.cookie).toContain('_ga');
  });

  test('clears marketing cookies when marketing is denied', () => {
    document.cookie = '_fbp=fb.1.12345; path=/';

    clearDeniedCookies({ necessary: true, analytics: true, marketing: false });

    expect(document.cookie).not.toContain('_fbp=fb.1.12345');
  });
});
