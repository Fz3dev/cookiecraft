/**
 * GTMConsentMode - Integration with Google Consent Mode v2
 */

import { ConsentCategories, GTMConsent } from '../types';
import { DataLayerManager } from './DataLayerManager';

export class GTMConsentMode {
  private dataLayerManager: DataLayerManager;

  constructor(dataLayerManager: DataLayerManager) {
    this.dataLayerManager = dataLayerManager;
  }

  /**
   * Set default consent state (MUST be called BEFORE GTM loads)
   */
  public setDefaultConsent(): void {
    this.dataLayerManager.push('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted', // Always granted
    });
  }

  /**
   * Update consent state based on user choices
   */
  public updateConsent(categories: ConsentCategories): void {
    const gtmConsent = this.mapCategoriesToGTM(categories);
    this.dataLayerManager.push('consent', 'update', gtmConsent);
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
