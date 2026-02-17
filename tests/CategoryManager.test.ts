import { CategoryManager } from '../src/blocking/CategoryManager';
import { ConsentCategories } from '../src/types';

describe('CategoryManager', () => {
  let cm: CategoryManager;

  beforeEach(() => {
    cm = new CategoryManager();
  });

  function makeScript(attrs: Record<string, string>): HTMLScriptElement {
    const el = document.createElement('script');
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'src') {
        // jsdom needs the full URL for .src property
        el.setAttribute('src', value);
      } else {
        el.setAttribute(key, value);
      }
    }
    return el;
  }

  test('returns explicit data-cookieconsent attribute', () => {
    const script = makeScript({ 'data-cookieconsent': 'marketing' });
    expect(cm.getCategoryForScript(script)).toBe('marketing');
  });

  test('matches analytics patterns by src', () => {
    const script = makeScript({ src: 'https://www.google-analytics.com/analytics.js' });
    expect(cm.getCategoryForScript(script)).toBe('analytics');
  });

  test('matches marketing patterns by src', () => {
    const script = makeScript({ src: 'https://connect.facebook.net/en_US/fbevents.js' });
    expect(cm.getCategoryForScript(script)).toBe('marketing');
  });

  test('googletagmanager.com is categorized as marketing', () => {
    const script = makeScript({ src: 'https://www.googletagmanager.com/gtm.js?id=GTM-XXX' });
    expect(cm.getCategoryForScript(script)).toBe('marketing');
  });

  test('returns null for unknown script with no src', () => {
    const script = makeScript({});
    script.textContent = 'console.log("hi")';
    expect(cm.getCategoryForScript(script)).toBeNull();
  });

  test('returns null for unknown external script', () => {
    const script = makeScript({ src: 'https://cdn.example.com/library.js' });
    expect(cm.getCategoryForScript(script)).toBeNull();
  });

  test('registerCategory adds custom patterns', () => {
    cm.registerCategory('custom', ['my-tracker.com']);
    const script = makeScript({ src: 'https://my-tracker.com/track.js' });
    expect(cm.getCategoryForScript(script)).toBe('custom');
  });

  test('isAllowed checks consent correctly', () => {
    const consent: ConsentCategories = { necessary: true, analytics: true, marketing: false };
    expect(cm.isAllowed('analytics', consent)).toBe(true);
    expect(cm.isAllowed('marketing', consent)).toBe(false);
  });

  test('isAllowed returns false for undefined category', () => {
    const consent: ConsentCategories = { necessary: true, analytics: true, marketing: false };
    expect(cm.isAllowed('unknown', consent)).toBe(false);
  });
});
