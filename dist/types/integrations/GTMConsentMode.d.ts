/**
 * GTMConsentMode - Full integration with Google Consent Mode v2
 */
import { ConsentCategories, ConsentConfig } from '../types';
import { DataLayerManager } from './DataLayerManager';
export declare class GTMConsentMode {
    private dataLayerManager;
    private config;
    constructor(dataLayerManager: DataLayerManager, config: ConsentConfig);
    /**
     * Set default consent state (MUST be called BEFORE GTM loads)
     * All non-essential consent types default to 'denied' per GDPR
     */
    setDefaultConsent(): void;
    /**
     * Update consent state based on user choices
     */
    updateConsent(categories: ConsentCategories): void;
    /**
     * Map consent categories to GTM Consent Mode v2 format
     */
    private mapCategoriesToGTM;
}
