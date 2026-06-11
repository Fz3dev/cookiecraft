/**
 * CookieConsent - Main orchestrator class
 */
import { ConsentConfig, ConsentCategories, ConsentRecord, ConsentEvent, EventCallback } from "../types";
import "../styles/banner.css";
import "../styles/animations.css";
import "../styles/preferences.css";
import "../styles/widget.css";
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
    getConsent(): ConsentRecord | null;
    /**
     * Reset consent (clear stored data and show banner)
     */
    reset(): void;
    /**
     * Register event handler
     */
    on(event: ConsentEvent, callback: EventCallback): void;
    /**
     * Unregister event handler
     */
    off(event: ConsentEvent, callback: EventCallback): void;
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
     * Apply consent by unblocking allowed scripts and clearing denied cookies
     */
    private applyConsent;
    /**
     * Validate and set default config values
     */
    private validateConfig;
}
