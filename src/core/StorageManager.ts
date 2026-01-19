/**
 * StorageManager - Manages localStorage persistence for consent records
 */

import { ConsentRecord } from '../types';

export class StorageManager {
  private static readonly STORAGE_KEY = 'cookiecraft_consent';
  private static readonly EXPIRY_MONTHS = 13;

  /**
   * Save consent record to localStorage
   */
  public save(consent: ConsentRecord): void {
    try {
      localStorage.setItem(
        StorageManager.STORAGE_KEY,
        JSON.stringify(consent)
      );
    } catch (e) {
      console.error('Failed to save consent:', e);
    }
  }

  /**
   * Load consent record from localStorage
   */
  public load(): ConsentRecord | null {
    try {
      const data = localStorage.getItem(StorageManager.STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);

      // Validate schema
      if (!this.validateSchema(parsed)) {
        // Try migration
        const migrated = this.migrate(parsed);
        if (migrated) {
          this.save(migrated);
          return migrated;
        }
        return null;
      }

      return parsed;
    } catch (e) {
      console.error('Failed to load consent:', e);
      return null;
    }
  }

  /**
   * Clear consent record from localStorage
   */
  public clear(): void {
    localStorage.removeItem(StorageManager.STORAGE_KEY);
  }

  /**
   * Check if consent record has expired
   */
  public isExpired(consent: ConsentRecord): boolean {
    const expiry = new Date(consent.expiresAt);
    return expiry < new Date();
  }

  /**
   * Validate consent record schema
   */
  private validateSchema(data: any): boolean {
    return (
      data &&
      typeof data.version === 'number' &&
      typeof data.timestamp === 'string' &&
      typeof data.categories === 'object' &&
      typeof data.userAgent === 'string' &&
      typeof data.expiresAt === 'string'
    );
  }

  /**
   * Migrate old consent format to new format
   * Returns null if migration fails
   */
  private migrate(oldData: any): ConsentRecord | null {
    // Handle migration from older versions
    // For v1, no migration needed - just return null
    return null;
  }
}
