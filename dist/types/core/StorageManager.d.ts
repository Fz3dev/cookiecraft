/**
 * StorageManager - Manages localStorage persistence for consent records
 */
import { ConsentRecord } from '../types';
export declare class StorageManager {
    private static readonly STORAGE_KEY;
    private static readonly EXPIRY_MONTHS;
    /**
     * Save consent record to localStorage
     */
    save(consent: ConsentRecord): void;
    /**
     * Load consent record from localStorage
     */
    load(): ConsentRecord | null;
    /**
     * Clear consent record from localStorage
     */
    clear(): void;
    /**
     * Check if consent record has expired
     */
    isExpired(consent: ConsentRecord): boolean;
    /**
     * Validate consent record schema
     */
    private validateSchema;
    /**
     * Migrate old consent format to new format
     * Returns null if migration fails
     */
    private migrate;
}
