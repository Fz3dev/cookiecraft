/**
 * GTMConsentMode - Integration with Google Consent Mode v2
 */
import { ConsentCategories } from '../types';
import { DataLayerManager } from './DataLayerManager';
export declare class GTMConsentMode {
    private dataLayerManager;
    constructor(dataLayerManager: DataLayerManager);
    /**
     * Set default consent state (MUST be called BEFORE GTM loads)
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
