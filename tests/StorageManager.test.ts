import { StorageManager } from '../src/core/StorageManager';
import { ConsentRecord } from '../src/types';

describe('StorageManager', () => {
  let sm: StorageManager;

  beforeEach(() => {
    sm = new StorageManager();
    localStorage.clear();
  });

  const validRecord: ConsentRecord = {
    version: 1,
    timestamp: new Date().toISOString(),
    categories: { necessary: true, analytics: false, marketing: false },
    expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
  };

  test('save and load round-trips correctly', () => {
    sm.save(validRecord);
    const loaded = sm.load();
    expect(loaded).toEqual(validRecord);
  });

  test('load returns null when storage is empty', () => {
    expect(sm.load()).toBeNull();
  });

  test('load returns null for invalid JSON', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    localStorage.setItem('cookiecraft_consent', 'not-json');
    expect(sm.load()).toBeNull();
    consoleError.mockRestore();
  });

  test('clear removes the consent record', () => {
    sm.save(validRecord);
    sm.clear();
    expect(sm.load()).toBeNull();
  });

  test('isExpired returns false for future date', () => {
    expect(sm.isExpired(validRecord)).toBe(false);
  });

  test('isExpired returns true for past date', () => {
    const expired: ConsentRecord = {
      ...validRecord,
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
    };
    expect(sm.isExpired(expired)).toBe(true);
  });

  test('isExpired returns true for invalid date string', () => {
    const invalid: ConsentRecord = {
      ...validRecord,
      expiresAt: 'not-a-date',
    };
    expect(sm.isExpired(invalid)).toBe(true);
  });

  test('load migrates old format with categories', () => {
    const old = {
      categories: { necessary: true, analytics: 1, marketing: 'yes' },
    };
    localStorage.setItem('cookiecraft_consent', JSON.stringify(old));
    const loaded = sm.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.categories.necessary).toBe(true);
    // Non-boolean values coerced: 1 !== true → false, 'yes' !== true → false
    expect(loaded!.categories.analytics).toBe(false);
    expect(loaded!.categories.marketing).toBe(false);
    expect(loaded!.version).toBe(1);
  });

  test('load returns null for completely invalid object', () => {
    localStorage.setItem('cookiecraft_consent', JSON.stringify({ foo: 'bar' }));
    expect(sm.load()).toBeNull();
  });

  test('save handles localStorage errors gracefully', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => sm.save(validRecord)).not.toThrow();
    expect(consoleError).toHaveBeenCalled();
    setItemSpy.mockRestore();
    consoleError.mockRestore();
  });

  test('clear handles localStorage errors gracefully', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('error');
    });
    expect(() => sm.clear()).not.toThrow();
    removeItemSpy.mockRestore();
    consoleError.mockRestore();
  });
});
