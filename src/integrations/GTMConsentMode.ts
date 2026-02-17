/**
 * GTMConsentMode - Full integration with Google Consent Mode v2
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
      security_storage: 'granted',
    };

    const waitForUpdate = this.config.gtmWaitForUpdate ?? 500;
    if (waitForUpdate > 0) {
      (defaults as Record<string, string | number>)['wait_for_update'] = waitForUpdate;
    }

    this.dataLayerManager.pushConsent('default', defaults);

    if (this.config.gtmUrlPassthrough) {
      this.dataLayerManager.pushSet('url_passthrough', true);
    }

    if (this.config.gtmAdsDataRedaction) {
      this.dataLayerManager.pushSet('ads_data_redaction', true);
    }
  }

  /**
   * Update consent state based on user choices
   */
  public updateConsent(categories: ConsentCategories): void {
    const gtmConsent = this.mapCategoriesToGTM(categories);
    this.dataLayerManager.pushConsent('update', gtmConsent);
  }

  /**
   * Map consent categories to GTM Consent Mode v2 format
   */
  private mapCategoriesToGTM(categories: ConsentCategories): GTMConsent {
    // When preferences category is not configured, default functionality to granted
    const hasPreferencesCategory = 'preferences' in this.config.categories;
    const preferencesGranted = hasPreferencesCategory
      ? categories.preferences === true
      : true;

    return {
      ad_storage: categories.marketing ? 'granted' : 'denied',
      ad_user_data: categories.marketing ? 'granted' : 'denied',
      ad_personalization: categories.marketing ? 'granted' : 'denied',
      analytics_storage: categories.analytics ? 'granted' : 'denied',
      functionality_storage: preferencesGranted ? 'granted' : 'denied',
      personalization_storage: preferencesGranted ? 'granted' : 'denied',
      security_storage: 'granted',
    };
  }
}
