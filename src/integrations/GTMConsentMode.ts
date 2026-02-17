/**
 * GTMConsentMode - Full integration with Google Consent Mode v2
 *
 * Implements all required signals:
 * - ad_storage, ad_user_data, ad_personalization, analytics_storage (core GCM v2)
 * - functionality_storage, personalization_storage, security_storage (non-core)
 * - wait_for_update, url_passthrough, ads_data_redaction (advanced features)
 */

import { ConsentCategories, ConsentConfig, GTMConsent } from '../types';
import { DataLayerManager } from './DataLayerManager';

export class GTMConsentMode {
  private dataLayerManager: DataLayerManager;
  private config: ConsentConfig;

  constructor(dataLayerManager: DataLayerManager, config: ConsentConfig) {
    this.dataLayerManager = dataLayerManager;
    this.config = config;
  }

  /**
   * Set default consent state (MUST be called BEFORE GTM loads)
   * All non-essential consent types default to 'denied' per GDPR
   */
  public setDefaultConsent(): void {
    const defaults: Record<string, string> = {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted', // Always granted
    };

    // Add wait_for_update to give CMP time to restore returning visitor consent
    const waitForUpdate = this.config.gtmWaitForUpdate ?? 500;
    if (waitForUpdate > 0) {
      (defaults as Record<string, string | number>)['wait_for_update'] = waitForUpdate;
    }

    this.dataLayerManager.pushConsent('default', defaults);

    // Set advanced features via gtag('set', ...)
    if (this.config.gtmUrlPassthrough) {
      this.dataLayerManager.pushSet('url_passthrough', true);
    }

    if (this.config.gtmAdsDataRedaction) {
      this.dataLayerManager.pushSet('ads_data_redaction', true);
    }
  }

  /**
   * Update consent state based on user choices
   * Called both on new consent and on page load for returning visitors
   */
  public updateConsent(categories: ConsentCategories): void {
    const gtmConsent = this.mapCategoriesToGTM(categories);
    this.dataLayerManager.pushConsent('update', gtmConsent);
  }

  /**
   * Map consent categories to GTM Consent Mode v2 format
   */
  private mapCategoriesToGTM(categories: ConsentCategories): GTMConsent {
    return {
      ad_storage: categories.marketing ? 'granted' : 'denied',
      ad_user_data: categories.marketing ? 'granted' : 'denied',
      ad_personalization: categories.marketing ? 'granted' : 'denied',
      analytics_storage: categories.analytics ? 'granted' : 'denied',
      functionality_storage: categories.preferences ? 'granted' : 'denied',
      personalization_storage: categories.preferences ? 'granted' : 'denied',
      security_storage: 'granted', // Always granted
    };
  }
}
