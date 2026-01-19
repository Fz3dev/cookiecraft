/**
 * PreferenceCenter - Modal for granular cookie preferences
 */
import { ConsentConfig, ConsentCategories } from '../types';
import { EventEmitter } from '../core/EventEmitter';
export declare class PreferenceCenter {
    private config;
    private element;
    private eventEmitter;
    private currentConsent;
    constructor(config: ConsentConfig, eventEmitter: EventEmitter, currentConsent: ConsentCategories);
    /**
     * Show the preference center
     */
    show(): void;
    /**
     * Hide the preference center
     */
    hide(): void;
    /**
     * Destroy the preference center
     */
    destroy(): void;
    /**
     * Create DOM structure for preference center
     */
    private createDOM;
    /**
     * Render category toggles
     */
    private renderCategories;
    /**
     * Attach event listeners
     */
    private attachListeners;
    /**
     * Handle save preferences
     */
    private handleSave;
    /**
     * Handle reject all
     */
    private handleRejectAll;
    /**
     * Trap focus within modal
     */
    private trapFocus;
    /**
     * Adjust color brightness for hover effect
     */
    private adjustColorBrightness;
}
