/**
 * Banner - Cookie consent banner component
 */
import { ConsentConfig } from '../types';
import { EventEmitter } from '../core/EventEmitter';
export declare class Banner {
    private config;
    private element;
    private eventEmitter;
    constructor(config: ConsentConfig, eventEmitter: EventEmitter);
    /**
     * Show the banner
     */
    show(): void;
    /**
     * Hide the banner
     */
    hide(): void;
    /**
     * Destroy the banner
     */
    destroy(): void;
    /**
     * Create DOM structure for banner
     */
    private createDOM;
    /**
     * Attach event listeners
     */
    private attachListeners;
    /**
     * Handle accept all action
     */
    private handleAcceptAll;
    /**
     * Handle reject all action
     */
    private handleRejectAll;
    /**
     * Handle customize action
     */
    private handleCustomize;
    /**
     * Generate description HTML with privacy policy link
     */
    private getDescriptionHTML;
}
