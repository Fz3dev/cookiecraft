/**
 * ConsentManager - Handles consent logic and validation
 */

import { ConsentConfig, ConsentCategories, ConsentRecord } from "../types";
import { StorageManager } from "./StorageManager";

export class ConsentManager {
  private consent: ConsentRecord | null = null;
  private config: ConsentConfig;

  constructor(config: ConsentConfig) {
    this.config = config;
  }

  /**
   * Validate consent categories
   */
  public validateConsent(categories: ConsentCategories): boolean {
    // Necessary cookies must always be enabled
    if (!categories.necessary) {
      return false;
    }

    // Validate against config (skip if no categories configured)
    if (
      this.config.categories &&
      Object.keys(this.config.categories).length > 0
    ) {
      for (const key of Object.keys(categories)) {
        if (!(key in this.config.categories)) {
          return false;
        }
      }
    }

    // Coerce all values to booleans
    for (const key of Object.keys(categories)) {
      categories[key] = categories[key] === true;
    }

    return true;
  }

  /**
   * Update consent with new categories
   */
  public updateConsent(categories: ConsentCategories): ConsentRecord {
    if (!this.validateConsent(categories)) {
      throw new Error("Invalid consent categories");
    }

    this.consent = this.createConsentRecord(categories);
    return this.consent;
  }

  /**
   * Check if stored consent needs update due to policy change
   */
  public needsUpdate(storedConsent: ConsentRecord): boolean {
    return storedConsent.version < this.config.revision;
  }

  /**
   * Get current consent record
   */
  public getCurrentConsent(): ConsentRecord | null {
    return this.consent;
  }

  /**
   * Create a new consent record
   */
  private createConsentRecord(categories: ConsentCategories): ConsentRecord {
    const now = new Date();
    const expiryDate = new Date(now);
    const expiryMonths =
      this.config.consentExpiryMonths ?? StorageManager.EXPIRY_MONTHS;
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

    return {
      version: this.config.revision,
      timestamp: now.toISOString(),
      categories: { ...categories },
      expiresAt: expiryDate.toISOString(),
    };
  }
}
