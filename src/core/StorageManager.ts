/**
 * StorageManager - Manages localStorage persistence for consent records
 */

import { ConsentCategories, ConsentRecord } from "../types";

export class StorageManager {
  private static readonly STORAGE_KEY = "cookiecraft_consent";
  // CNIL recommends 6 months consent validity (configurable via consentExpiryMonths)
  public static readonly EXPIRY_MONTHS = 6;

  /**
   * Save consent record to localStorage
   */
  public save(consent: ConsentRecord): void {
    try {
      localStorage.setItem(StorageManager.STORAGE_KEY, JSON.stringify(consent));
    } catch (e) {
      console.error("Failed to save consent:", e);
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
      console.error("Failed to load consent:", e);
      return null;
    }
  }

  /**
   * Clear consent record from localStorage
   */
  public clear(): void {
    try {
      localStorage.removeItem(StorageManager.STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear consent:", e);
    }
  }

  /**
   * Check if consent record has expired
   */
  public isExpired(consent: ConsentRecord): boolean {
    const expiry = new Date(consent.expiresAt);
    if (isNaN(expiry.getTime())) return true;
    return expiry < new Date();
  }

  /**
   * Validate consent record schema
   */
  private validateSchema(data: any): boolean {
    return (
      data &&
      typeof data.version === "number" &&
      typeof data.timestamp === "string" &&
      typeof data.categories === "object" &&
      typeof data.expiresAt === "string"
    );
  }

  /**
   * Migrate old consent format to new format
   * Returns null if migration fails
   */
  private migrate(data: unknown): ConsentRecord | null {
    if (!data || typeof data !== "object") return null;

    const record = data as Record<string, unknown>;

    // Attempt to reconstruct a valid record from partial data
    if (record.categories && typeof record.categories === "object") {
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + StorageManager.EXPIRY_MONTHS);

      // Coerce category values to booleans
      const rawCategories = record.categories as Record<string, unknown>;
      const categories: ConsentCategories = {
        necessary: rawCategories.necessary === true,
        analytics: rawCategories.analytics === true,
        marketing: rawCategories.marketing === true,
      };
      if ("preferences" in rawCategories) {
        categories.preferences = rawCategories.preferences === true;
      }

      return {
        version: typeof record.version === "number" ? record.version : 1,
        timestamp:
          typeof record.timestamp === "string"
            ? record.timestamp
            : now.toISOString(),
        categories,
        expiresAt:
          typeof record.expiresAt === "string"
            ? record.expiresAt
            : expiryDate.toISOString(),
      };
    }

    return null;
  }
}
