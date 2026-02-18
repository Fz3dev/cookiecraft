/**
 * CookieConsent - Main orchestrator class
 */

import { ConsentConfig, ConsentCategories, ConsentRecord, ConsentEvent, EventCallback } from '../types';
import { ConsentManager } from './ConsentManager';
import { StorageManager } from './StorageManager';
import { EventEmitter } from './EventEmitter';
import { ScriptBlocker } from '../blocking/ScriptBlocker';
import { CategoryManager } from '../blocking/CategoryManager';
import { Banner } from '../ui/Banner';
import { PreferenceCenter } from '../ui/PreferenceCenter';
import { FloatingWidget } from '../ui/FloatingWidget';
import { GTMConsentMode } from '../integrations/GTMConsentMode';
import { DataLayerManager } from '../integrations/DataLayerManager';
import { clearDeniedCookies } from '../utils/cookies';
import { builtInTranslations } from '../i18n/translations';

// Import CSS
import '../styles/banner.css';
import '../styles/animations.css';
import '../styles/preferences.css';
import '../styles/widget.css';

export class CookieConsent {
  private config: ConsentConfig;
  private consentManager: ConsentManager;
  private storageManager: StorageManager;
  private scriptBlocker: ScriptBlocker;
  private eventEmitter: EventEmitter;
  private banner: Banner | null = null;
  private preferenceCenter: PreferenceCenter | null = null;
  private floatingWidget: FloatingWidget | null = null;
  private gtmIntegration: GTMConsentMode | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: ConsentConfig) {
    // SSR guard
    if (typeof window === 'undefined') {
      this.config = config as ConsentConfig;
      this.consentManager = null as any;
      this.storageManager = null as any;
      this.eventEmitter = null as any;
      this.scriptBlocker = null as any;
      return;
    }

    this.config = this.validateConfig(config);
    this.consentManager = new ConsentManager(this.config);
    this.storageManager = new StorageManager();
    this.eventEmitter = new EventEmitter();
    this.scriptBlocker = new ScriptBlocker(
      new CategoryManager(),
      this.eventEmitter
    );

    if (this.config.gtmConsentMode) {
      this.gtmIntegration = new GTMConsentMode(new DataLayerManager(), this.config);
    }

    // Listen for consent events — callbacks are fired AFTER consent is persisted
    this.eventEmitter.on('consent:accept', (categories: ConsentCategories) => {
      this.updateConsent(categories);
      this.config.onAccept?.(categories);
    });

    this.eventEmitter.on('consent:reject', (categories: ConsentCategories) => {
      this.updateConsent(categories);
      this.config.onReject?.();
    });

    this.eventEmitter.on('consent:update', (categories: ConsentCategories) => {
      this.updateConsent(categories);
      this.config.onChange?.(categories);
    });

    this.eventEmitter.on('preferences:show', () => {
      this.showPreferences();
    });
  }

  /**
   * Initialize the cookie consent system
   */
  public init(): void {
    if (typeof window === 'undefined') return;

    // 1. Start blocking scripts immediately
    this.scriptBlocker.init();

    // 2. Set GTM default consent BEFORE checking storage
    if (this.gtmIntegration) {
      this.gtmIntegration.setDefaultConsent();
    }

    // 3. Check for existing consent
    const storedConsent = this.storageManager.load();

    if (storedConsent && !this.storageManager.isExpired(storedConsent)) {
      if (this.consentManager.needsUpdate(storedConsent)) {
        if (this.config.autoShow) {
          this.showBanner();
        }
      } else {
        this.applyConsent(storedConsent.categories);

        if (this.gtmIntegration) {
          this.gtmIntegration.updateConsent(storedConsent.categories);
        }

        this.eventEmitter.emit('consent:load', storedConsent);

        if (this.config.showWidget) {
          this.showFloatingWidget();
        }
      }
    } else {
      if (this.config.autoShow) {
        this.showBanner();
      }
    }

    // Store instance globally
    window.cookieConsent = this;

    this.eventEmitter.emit('consent:init');
  }

  /**
   * Show the banner
   */
  public show(): void {
    this.showBanner();
  }

  /**
   * Hide the banner
   */
  public hide(): void {
    this.banner?.hide();
  }

  /**
   * Show preferences modal
   */
  public showPreferences(): void {
    const stored = this.storageManager.load()?.categories;
    // Default to all ON when no prior consent
    const currentConsent: ConsentCategories = stored || {
      necessary: true,
      analytics: true,
      marketing: true,
    };

    // Add any configured categories not in current consent
    for (const key of Object.keys(this.config.categories)) {
      if (!(key in currentConsent)) {
        currentConsent[key] = key === 'necessary';
      }
    }

    if (this.preferenceCenter) {
      this.preferenceCenter.destroy();
    }

    this.preferenceCenter = new PreferenceCenter(
      this.config,
      this.eventEmitter,
      currentConsent
    );
    this.preferenceCenter.show();
  }

  /**
   * Update consent with new categories
   */
  public updateConsent(categories: ConsentCategories): void {
    const consentRecord = this.consentManager.updateConsent(categories);
    this.storageManager.save(consentRecord);
    this.applyConsent(categories);

    if (this.gtmIntegration) {
      this.gtmIntegration.updateConsent(categories);
    }

    // Show floating widget after consent is given
    if (this.config.showWidget) {
      setTimeout(() => {
        this.showFloatingWidget();
      }, 400);
    }
  }

  /**
   * Get current consent
   */
  public getConsent(): ConsentRecord | null {
    return this.storageManager.load();
  }

  /**
   * Reset consent (clear stored data and show banner)
   */
  public reset(): void {
    this.storageManager.clear();
    this.scriptBlocker.block();

    const denied: ConsentCategories = { necessary: true, analytics: false, marketing: false };
    for (const key of Object.keys(this.config.categories)) {
      if (key !== 'necessary') denied[key] = false;
    }

    clearDeniedCookies(denied as Record<string, boolean>);

    if (this.gtmIntegration) {
      this.gtmIntegration.updateConsent(denied);
    }

    this.config.onReject?.();
    this.showBanner();
  }

  /**
   * Register event handler
   */
  public on(event: ConsentEvent, callback: EventCallback): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unregister event handler
   */
  public off(event: ConsentEvent, callback: EventCallback): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Destroy and cleanup all UI elements
   */
  public destroy(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.banner?.destroy();
    this.banner = null;
    this.preferenceCenter?.destroy();
    this.preferenceCenter = null;
    this.floatingWidget?.destroy();
    this.floatingWidget = null;
    this.scriptBlocker?.destroy();
    this.eventEmitter.clear();
    if (window.cookieConsent === this) {
      window.cookieConsent = undefined;
    }
  }

  /**
   * Show the banner
   */
  private showBanner(): void {
    if (!this.banner) {
      this.banner = new Banner(this.config, this.eventEmitter);
    }
    this.banner.show();
    this.eventEmitter.emit('consent:show');
  }

  /**
   * Show the floating widget
   */
  private showFloatingWidget(): void {
    if (!this.floatingWidget) {
      this.floatingWidget = new FloatingWidget(this.config, this.eventEmitter);
    }
    this.floatingWidget.show();
  }

  /**
   * Apply consent by unblocking allowed scripts and clearing denied cookies
   */
  private applyConsent(categories: ConsentCategories): void {
    this.scriptBlocker.unblock(categories);
    clearDeniedCookies(categories as Record<string, boolean>);
  }

  /**
   * Validate and set default config values
   */
  private validateConfig(config: ConsentConfig): ConsentConfig {
    // Merge built-in language translations with user overrides
    const langKey = config.language?.toLowerCase().split('-')[0] || 'en';
    const langDefaults = builtInTranslations[langKey] || builtInTranslations['en'];
    const mergedTranslations = { ...langDefaults, ...config.translations };

    return {
      ...config,
      translations: mergedTranslations,
      categories: config.categories || {
        necessary: {
          enabled: true,
          readOnly: true,
          label: 'Essential',
          description: 'Required for the website to function properly.',
        },
        analytics: {
          enabled: true,
          readOnly: false,
          label: 'Analytics',
          description: 'Help us understand how you use our site.',
        },
        marketing: {
          enabled: true,
          readOnly: false,
          label: 'Marketing',
          description: 'Used to deliver relevant advertisements.',
        },
      },
      mode: config.mode || 'opt-in',
      autoShow: config.autoShow !== undefined ? config.autoShow : true,
      revision: config.revision || 1,
      gtmConsentMode: config.gtmConsentMode || false,
      disablePageInteraction: config.disablePageInteraction || false,
      theme: config.theme || 'light',
      position: config.position || 'bottom-left',
      layout: config.layout || 'box',
      backdropBlur: config.backdropBlur !== false,
      animationStyle: config.animationStyle || 'smooth',
      preferencesPosition: config.preferencesPosition || 'center',
      showWidget: config.showWidget !== undefined ? config.showWidget : true,
      widgetPosition: config.widgetPosition || 'bottom-left',
      widgetStyle: config.widgetStyle || 'compact',
    };
  }
}
