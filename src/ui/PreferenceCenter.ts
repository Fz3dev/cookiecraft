/**
 * PreferenceCenter - Modal for granular cookie preferences
 */

import { ConsentConfig, ConsentCategories } from '../types';
import { EventEmitter } from '../core/EventEmitter';

export class PreferenceCenter {
  private config: ConsentConfig;
  private element: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private currentConsent: ConsentCategories;

  constructor(
    config: ConsentConfig,
    eventEmitter: EventEmitter,
    currentConsent: ConsentCategories
  ) {
    this.config = config;
    this.eventEmitter = eventEmitter;
    this.currentConsent = currentConsent;
  }

  /**
   * Show the preference center
   */
  public show(): void {
    if (!this.element) {
      this.element = this.createDOM();
      document.body.appendChild(this.element);
      this.attachListeners();
    }

    this.element.classList.add('is-visible');
    this.trapFocus();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide the preference center
   */
  public hide(): void {
    this.element?.classList.remove('is-visible');
    document.body.style.overflow = '';

    setTimeout(() => {
      this.destroy();
    }, 300);
  }

  /**
   * Destroy the preference center
   */
  public destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Create DOM structure for preference center
   */
  private createDOM(): HTMLElement {
    const translations = this.config.translations || {};
    const theme = this.config.theme || 'light';
    const position = this.config.preferencesPosition || 'center';

    const template = `
      <div
        class="cc-modal cc-modal--${position}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-modal-title"
        data-theme="${theme}"
      >
        <div class="cc-modal__overlay" data-action="close"></div>
        <div class="cc-modal__content">
          <div class="cc-modal__header" style="${this.config.primaryColor ? `--cc-primary: ${this.config.primaryColor}; --cc-primary-hover: ${this.adjustColorBrightness(this.config.primaryColor, -15)};` : ''}">
            <h2 id="cc-modal-title">
              ${translations.preferencesTitle || translations.title || 'Préférences de cookies'}
            </h2>
            <button
              class="cc-modal__close"
              aria-label="Fermer"
              data-action="close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="cc-modal__body">
            ${this.renderCategories()}
          </div>

          <div class="cc-modal__footer">
            <div class="cc-modal__footer-links">
              ${translations.privacyPolicyUrl ? `
                <a href="${translations.privacyPolicyUrl}" target="_blank" rel="noopener noreferrer" class="cc-privacy-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  ${translations.privacyPolicyLabel || 'Politique de confidentialité'}
                </a>
              ` : ''}
            </div>
            <div class="cc-modal__footer-actions">
              <button
                class="cc-btn cc-btn--secondary"
                data-action="reject"
              >
                ${translations.rejectAll || 'Tout rejeter'}
              </button>
              <button
                class="cc-btn cc-btn--primary"
                data-action="save"
              >
                ${translations.savePreferences || 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = template.trim();
    return wrapper.firstChild as HTMLElement;
  }

  /**
   * Render category toggles
   */
  private renderCategories(): string {
    const categories = Object.entries(this.config.categories);

    return categories
      .map(([key, config]) => {
        const checked = this.currentConsent[key as keyof ConsentCategories];
        const disabled = config.readOnly;

        return `
        <div class="cc-category">
          <div class="cc-category__header">
            <label class="cc-toggle ${disabled ? 'cc-toggle--disabled' : ''}">
              <input
                type="checkbox"
                data-category="${key}"
                ${checked ? 'checked' : ''}
                ${disabled ? 'disabled' : ''}
                aria-label="${config.label} cookies"
              >
              <span class="cc-toggle__slider"></span>
            </label>
            <div class="cc-category__info">
              <h3>${config.label}</h3>
              <p>${config.description}</p>
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  }

  /**
   * Attach event listeners
   */
  private attachListeners(): void {
    this.element?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');

      if (action === 'close') {
        this.hide();
      } else if (action === 'save') {
        this.handleSave();
      } else if (action === 'reject') {
        this.handleRejectAll();
      }
    });

    // Keyboard shortcuts
    this.element?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  /**
   * Handle save preferences
   */
  private handleSave(): void {
    const checkboxes = this.element?.querySelectorAll('input[data-category]');
    const categories: ConsentCategories = {
      necessary: true,
      analytics: false,
      marketing: false,
    };

    checkboxes?.forEach((checkbox) => {
      if (checkbox instanceof HTMLInputElement) {
        const category = checkbox.getAttribute('data-category');
        if (category) {
          categories[category as keyof ConsentCategories] = checkbox.checked;
        }
      }
    });

    this.eventEmitter.emit('consent:update', categories);
    this.config.onChange?.(categories);
    this.hide();
  }

  /**
   * Handle reject all
   */
  private handleRejectAll(): void {
    const necessaryOnly: ConsentCategories = {
      necessary: true,
      analytics: false,
      marketing: false,
    };

    // Only add preferences if it's configured
    if (this.config.categories.preferences) {
      necessaryOnly.preferences = false;
    }

    this.eventEmitter.emit('consent:reject', necessaryOnly);
    this.hide();
  }

  /**
   * Trap focus within modal
   */
  private trapFocus(): void {
    const focusableElements = this.element?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstFocusable?.focus();

    // Trap focus
    this.element?.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  /**
   * Adjust color brightness for hover effect
   */
  private adjustColorBrightness(color: string, percent: number): string {
    // Remove # if present
    const hex = color.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Adjust brightness
    const adjust = (value: number) => {
      const adjusted = value + (value * percent / 100);
      return Math.max(0, Math.min(255, Math.round(adjusted)));
    };

    // Convert back to hex
    const toHex = (value: number) => {
      const hex = value.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
  }
}
