/**
 * DataLayerManager - Manages Google Tag Manager dataLayer communication
 * Implements Google Consent Mode v2 correctly via gtag() API
 */
export declare class DataLayerManager {
    /**
     * Initialize gtag function if not already present
     * This must be called before GTM loads for consent defaults to work
     */
    private ensureGtag;
    /**
     * Push consent command via gtag (correct format for Google Consent Mode v2)
     * Usage: pushConsent('default', {...}) or pushConsent('update', {...})
     */
    pushConsent(action: string, params: Record<string, string | number>): void;
    /**
     * Push a 'set' command via gtag for advanced features
     * Usage: pushSet('url_passthrough', true) or pushSet('ads_data_redaction', true)
     */
    pushSet(key: string, value: boolean | string | number): void;
}
