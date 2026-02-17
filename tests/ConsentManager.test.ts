import { ConsentManager } from '../src/core/ConsentManager';
import { ConsentConfig, ConsentCategories } from '../src/types';

const baseConfig: ConsentConfig = {
  mode: 'opt-in',
  autoShow: true,
  revision: 1,
  categories: {
    necessary: { enabled: true, readOnly: true, label: 'Essential', description: '' },
    analytics: { enabled: true, readOnly: false, label: 'Analytics', description: '' },
    marketing: { enabled: true, readOnly: false, label: 'Marketing', description: '' },
  },
};

describe('ConsentManager', () => {
  let cm: ConsentManager;

  beforeEach(() => {
    cm = new ConsentManager(baseConfig);
  });

  test('needsConsent returns true initially', () => {
    expect(cm.needsConsent()).toBe(true);
  });

  test('getCurrentConsent returns null initially', () => {
    expect(cm.getCurrentConsent()).toBeNull();
  });

  test('validateConsent rejects missing necessary=true', () => {
    const cats: ConsentCategories = { necessary: false, analytics: true, marketing: true };
    expect(cm.validateConsent(cats)).toBe(false);
  });

  test('validateConsent accepts valid categories', () => {
    const cats: ConsentCategories = { necessary: true, analytics: true, marketing: false };
    expect(cm.validateConsent(cats)).toBe(true);
  });

  test('validateConsent rejects unknown category keys', () => {
    const cats = { necessary: true, analytics: true, marketing: true, unknown: true } as ConsentCategories;
    expect(cm.validateConsent(cats)).toBe(false);
  });

  test('validateConsent coerces values to booleans', () => {
    const cats = { necessary: true, analytics: 1, marketing: 'yes' } as unknown as ConsentCategories;
    // necessary=true passes, but analytics/marketing are not === true so they become false
    cm.validateConsent(cats);
    expect(cats.analytics).toBe(false);
    expect(cats.marketing).toBe(false);
  });

  test('updateConsent creates a valid ConsentRecord', () => {
    const cats: ConsentCategories = { necessary: true, analytics: true, marketing: false };
    const record = cm.updateConsent(cats);
    expect(record.version).toBe(1);
    expect(record.categories.necessary).toBe(true);
    expect(record.categories.analytics).toBe(true);
    expect(record.categories.marketing).toBe(false);
    expect(typeof record.timestamp).toBe('string');
    expect(typeof record.expiresAt).toBe('string');
  });

  test('updateConsent throws for invalid categories', () => {
    const cats: ConsentCategories = { necessary: false, analytics: true, marketing: true };
    expect(() => cm.updateConsent(cats)).toThrow('Invalid consent categories');
  });

  test('needsConsent returns false after updateConsent', () => {
    const cats: ConsentCategories = { necessary: true, analytics: false, marketing: false };
    cm.updateConsent(cats);
    expect(cm.needsConsent()).toBe(false);
  });

  test('getCurrentConsent returns record after updateConsent', () => {
    const cats: ConsentCategories = { necessary: true, analytics: false, marketing: false };
    cm.updateConsent(cats);
    expect(cm.getCurrentConsent()).not.toBeNull();
    expect(cm.getCurrentConsent()!.categories).toEqual(cats);
  });

  test('needsUpdate detects stale revision', () => {
    const cats: ConsentCategories = { necessary: true, analytics: false, marketing: false };
    const record = cm.updateConsent(cats);
    const configV2 = { ...baseConfig, revision: 2 };
    const cm2 = new ConsentManager(configV2);
    expect(cm2.needsUpdate(record)).toBe(true);
  });

  test('needsUpdate returns false for current revision', () => {
    const cats: ConsentCategories = { necessary: true, analytics: false, marketing: false };
    const record = cm.updateConsent(cats);
    expect(cm.needsUpdate(record)).toBe(false);
  });

  test('updateConsent stores deep copy of categories', () => {
    const cats: ConsentCategories = { necessary: true, analytics: true, marketing: false };
    const record = cm.updateConsent(cats);
    cats.analytics = false;
    expect(record.categories.analytics).toBe(true);
  });

  test('expiry date is ~13 months in the future', () => {
    const cats: ConsentCategories = { necessary: true, analytics: false, marketing: false };
    const record = cm.updateConsent(cats);
    const expiry = new Date(record.expiresAt);
    const now = new Date();
    const diffMonths = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    expect(diffMonths).toBeGreaterThanOrEqual(12);
    expect(diffMonths).toBeLessThanOrEqual(14);
  });
});
