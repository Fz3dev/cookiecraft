/**
 * ConsentManager - Handles consent logic and validation
 */

import { ConsentConfig, ConsentCategories, ConsentRecord } from '../types';

export class ConsentManager {
  private consent!: ConsentRecord;
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

    // Validate against config
    for (const key of Object.keys(categories)) {
      if (!(key in this.config.categories)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update consent with new categories
   */
  public updateConsent(categories: ConsentCategories): ConsentRecord {
    if (!this.validateConsent(categories)) {
      throw new Error('Invalid consent categories');
    }

    this.consent = this.createConsentRecord(categories);
    return this.consent;
  }

  /**
   * Check if user needs to give consent
   */
  public needsConsent(): boolean {
    return this.consent === undefined;
  }

  /**
   * Check if stored consent needs update due to policy change
   */
  public needsUpdate(storedConsent: ConsentRecord): boolean {
    // Check if policy version has changed
    return storedConsent.version < this.config.revision;
  }

  /**
   * Get current consent record
   */
  public getCurrentConsent(): ConsentRecord {
    return this.consent;
  }

  /**
   * Create a new consent record
   */
  private createConsentRecord(categories: ConsentCategories): ConsentRecord {
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + 13); // 13 months per GDPR

    return {
      version: this.config.revision,
      timestamp: now.toISOString(),
      categories: { ...categories },
      userAgent: navigator.userAgent,
      expiresAt: expiryDate.toISOString(),
    };
  }
}
