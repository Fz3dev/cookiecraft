/**
 * DataLayerManager - Manages Google Tag Manager dataLayer communication
 */
export declare class DataLayerManager {
    /**
     * Push data to GTM dataLayer
     */
    push(command: string, action: string, params: any): void;
}
