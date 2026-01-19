/**
 * ConsentManager - Handles consent logic and validation
 */
import { ConsentConfig, ConsentCategories, ConsentRecord } from '../types';
export declare class ConsentManager {
    private consent;
    private config;
    constructor(config: ConsentConfig);
    /**
     * Validate consent categories
     */
    validateConsent(categories: ConsentCategories): boolean;
    /**
     * Update consent with new categories
     */
    updateConsent(categories: ConsentCategories): ConsentRecord;
    /**
     * Check if user needs to give consent
     */
    needsConsent(): boolean;
    /**
     * Check if stored consent needs update due to policy change
     */
    needsUpdate(storedConsent: ConsentRecord): boolean;
    /**
     * Get current consent record
     */
    getCurrentConsent(): ConsentRecord;
    /**
     * Create a new consent record
     */
    private createConsentRecord;
}
