/**
 * DataLayerManager - Manages Google Tag Manager dataLayer communication
 */

export class DataLayerManager {
  /**
   * Push data to GTM dataLayer
   */
  public push(command: string, action: string, params: any): void {
    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];

    // Push to dataLayer
    window.dataLayer.push({
      event: 'consent_update',
      [command]: {
        [action]: params,
      },
    });

    // Also push using gtag format if available
    if (typeof window.gtag === 'function') {
      window.gtag(command, action, params);
    }
  }
}
