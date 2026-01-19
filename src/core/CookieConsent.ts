/**
 * CookieConsent - Main orchestrator class
 */

import { ConsentConfig, ConsentCategories } from '../types';
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

  constructor(config: ConsentConfig) {
    this.config = this.validateConfig(config);
    this.consentManager = new ConsentManager(this.config);
    this.storageManager = new StorageManager();
    this.eventEmitter = new EventEmitter();
    this.scriptBlocker = new ScriptBlocker(
      new CategoryManager(),
      this.eventEmitter
    );

    if (this.config.gtmConsentMode) {
      this.gtmIntegration = new GTMConsentMode(new DataLayerManager());
    }

    // Listen for preference center requests
    this.eventEmitter.on('preferences:show', () => {
      this.showPreferences();
    });

    // Listen for consent updates
    this.eventEmitter.on('consent:accept', (categories: ConsentCategories) => {
      this.updateConsent(categories);
    });

    this.eventEmitter.on('consent:reject', (categories: ConsentCategories) => {
      this.updateConsent(categories);
    });

    this.eventEmitter.on('consent:update', (categories: ConsentCategories) => {
      this.updateConsent(categories);
    });
  }

  /**
   * Initialize the cookie consent system
   */
  public init(): void {
    // 1. Start blocking scripts immediately
    this.scriptBlocker.init();

    // 2. Set GTM default consent BEFORE checking storage
    if (this.gtmIntegration) {
      this.gtmIntegration.setDefaultConsent();
    }

    // 3. Check for existing consent
    const storedConsent = this.storageManager.load();

    if (storedConsent && !this.storageManager.isExpired(storedConsent)) {
      // Valid consent exists
      if (this.consentManager.needsUpdate(storedConsent)) {
        // Policy updated, show banner again
        if (this.config.autoShow) {
          this.showBanner();
        }
      } else {
        // Apply stored consent
        this.applyConsent(storedConsent.categories);
        this.eventEmitter.emit('consent:load', storedConsent);

        // Show floating widget if enabled
        if (this.config.showWidget) {
          this.showFloatingWidget();
        }
      }
    } else {
      // No consent or expired
      if (this.config.autoShow) {
        this.showBanner();
      }
    }

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
    const currentConsent =
      this.storageManager.load()?.categories || {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      };

    // Always recreate to get fresh state from storage
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

    // Show floating widget after consent is given (delay to let banner hide)
    if (this.config.showWidget) {
      console.log('⏳ Widget will show in 400ms...');
      setTimeout(() => {
        console.log('🚀 Calling showFloatingWidget()');
        this.showFloatingWidget();
      }, 400); // Wait for banner hide animation
    } else {
      console.log('❌ Widget disabled in config');
    }
  }

  /**
   * Get current consent
   */
  public getConsent() {
    return this.storageManager.load();
  }

  /**
   * Reset consent (clear stored data and show banner)
   */
  public reset(): void {
    this.storageManager.clear();
    this.scriptBlocker.block();
    this.showBanner();
  }

  /**
   * Register event handler
   */
  public on(event: string, callback: Function): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unregister event handler
   */
  public off(event: string, callback: Function): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Destroy and cleanup all UI elements
   */
  public destroy(): void {
    this.banner?.destroy();
    this.banner = null;
    this.preferenceCenter?.destroy();
    this.preferenceCenter = null;
    this.floatingWidget?.destroy();
    this.floatingWidget = null;
    this.scriptBlocker?.destroy();
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
   * Apply consent by unblocking scripts
   */
  private applyConsent(categories: ConsentCategories): void {
    this.scriptBlocker.unblock(categories);
  }

  /**
   * Validate and set default config values
   */
  private validateConfig(config: ConsentConfig): ConsentConfig {
    return {
      ...config,
      mode: config.mode || 'opt-in',
      autoShow: config.autoShow !== undefined ? config.autoShow : true,
      revision: config.revision || 1,
      gtmConsentMode: config.gtmConsentMode || false,
      disablePageInteraction: config.disablePageInteraction || false,
      theme: config.theme || 'light',
      position: config.position || 'bottom',
      layout: config.layout || 'bar',
      backdropBlur: config.backdropBlur !== false,
      animationStyle: config.animationStyle || 'smooth',
      preferencesPosition: config.preferencesPosition || 'center',
      showWidget: config.showWidget !== undefined ? config.showWidget : true,
      widgetPosition: config.widgetPosition || 'bottom-right',
    };
  }
}
