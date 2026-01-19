/**
 * CookieConsent - Main orchestrator class
 */
import { ConsentConfig, ConsentCategories } from '../types';
import '../styles/banner.css';
import '../styles/animations.css';
import '../styles/preferences.css';
import '../styles/widget.css';
export declare class CookieConsent {
    private config;
    private consentManager;
    private storageManager;
    private scriptBlocker;
    private eventEmitter;
    private banner;
    private preferenceCenter;
    private floatingWidget;
    private gtmIntegration;
    constructor(config: ConsentConfig);
    /**
     * Initialize the cookie consent system
     */
    init(): void;
    /**
     * Show the banner
     */
    show(): void;
    /**
     * Hide the banner
     */
    hide(): void;
    /**
     * Show preferences modal
     */
    showPreferences(): void;
    /**
     * Update consent with new categories
     */
    updateConsent(categories: ConsentCategories): void;
    /**
     * Get current consent
     */
    getConsent(): import("../types").ConsentRecord | null;
    /**
     * Reset consent (clear stored data and show banner)
     */
    reset(): void;
    /**
     * Register event handler
     */
    on(event: string, callback: Function): void;
    /**
     * Unregister event handler
     */
    off(event: string, callback: Function): void;
    /**
     * Destroy and cleanup all UI elements
     */
    destroy(): void;
    /**
     * Show the banner
     */
    private showBanner;
    /**
     * Show the floating widget
     */
    private showFloatingWidget;
    /**
     * Apply consent by unblocking scripts
     */
    private applyConsent;
    /**
     * Validate and set default config values
     */
    private validateConfig;
}
