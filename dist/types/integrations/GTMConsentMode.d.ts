/**
 * GTMConsentMode - Full integration with Google Consent Mode v2
 *
 * Implements all required signals:
 * - ad_storage, ad_user_data, ad_personalization, analytics_storage (core GCM v2)
 * - functionality_storage, personalization_storage, security_storage (non-core)
 * - wait_for_update, url_passthrough, ads_data_redaction (advanced features)
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
     * Called both on new consent and on page load for returning visitors
     */
    updateConsent(categories: ConsentCategories): void;
    /**
     * Map consent categories to GTM Consent Mode v2 format
     */
    private mapCategoriesToGTM;
}
