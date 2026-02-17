/**
 * PreferenceCenter - Modal for granular cookie preferences
 */

import { ConsentConfig, ConsentCategories } from '../types';
import { EventEmitter } from '../core/EventEmitter';
import { escapeHtml, sanitizeUrl, sanitizeColor } from '../utils/sanitize';
import { buildColorStyle } from '../utils/color';

export class PreferenceCenter {
  private config: ConsentConfig;
  private element: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private currentConsent: ConsentCategories;
  private previousActiveElement: HTMLElement | null = null;

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
    const append = () => {
      if (!this.element) {
        this.previousActiveElement = document.activeElement as HTMLElement | null;
        this.element = this.createDOM();
        document.body.appendChild(this.element);
        this.attachListeners();
      }

      this.element.classList.add('is-visible');
      this.trapFocus();

      document.body.style.overflow = 'hidden';
    };

    if (!document.body) {
      document.addEventListener('DOMContentLoaded', append);
      return;
    }
    append();
  }

  /**
   * Hide the preference center
   */
  public hide(): void {
    this.element?.classList.remove('is-visible');
    document.body.style.overflow = '';

    // Restore focus to triggering element
    if (this.previousActiveElement && document.contains(this.previousActiveElement)) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }

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

    const safeColor = this.config.primaryColor ? sanitizeColor(this.config.primaryColor) : '';
    const colorStyle = buildColorStyle(safeColor);

    const privacyLinkHtml = translations.privacyPolicyUrl
      ? (() => {
          const safeUrl = sanitizeUrl(translations.privacyPolicyUrl);
          if (!safeUrl) return '';
          return `
            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="cc-privacy-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              ${escapeHtml(translations.privacyPolicyLabel || 'Privacy Policy')}
            </a>
          `;
        })()
      : '';

    const template = `
      <div
        class="cc-modal cc-modal--${escapeHtml(position)}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-modal-title"
        data-theme="${escapeHtml(theme)}"
        style="${colorStyle}"
      >
        <div class="cc-modal__overlay"></div>
        <div class="cc-modal__content">
          <div class="cc-modal__header">
            <h2 id="cc-modal-title">
              ${escapeHtml(translations.preferencesTitle || translations.title || 'Cookie Preferences')}
            </h2>
          </div>

          <div class="cc-modal__body">
            ${this.renderCategories()}
          </div>

          <div class="cc-modal__footer">
            <div class="cc-modal__footer-links">
              ${privacyLinkHtml}
            </div>
            <div class="cc-modal__footer-actions">
              <button
                class="cc-btn cc-btn--secondary"
                data-action="reject"
              >
                ${escapeHtml(translations.essentialsOnly || 'Essentials only')}
              </button>
              <button
                class="cc-btn cc-btn--primary"
                data-action="save"
              >
                ${escapeHtml(translations.savePreferences || 'Save preferences')}
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
        const checked = this.currentConsent[key] === true;
        const disabled = config.readOnly;

        return `
        <div class="cc-category">
          <div class="cc-category__header">
            <label class="cc-toggle ${disabled ? 'cc-toggle--disabled' : ''}">
              <input
                type="checkbox"
                data-category="${escapeHtml(key)}"
                ${checked ? 'checked' : ''}
                ${disabled ? 'disabled' : ''}
                aria-label="${escapeHtml(config.label)} cookies"
              >
              <span class="cc-toggle__slider"></span>
            </label>
            <div class="cc-category__info">
              <h3>${escapeHtml(config.label)}</h3>
              <p>${escapeHtml(config.description)}</p>
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
      const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
      if (!target) return;
      const action = target.getAttribute('data-action');

      if (action === 'save') {
        this.handleSave();
      } else if (action === 'reject') {
        this.handleRejectAll();
      }
    });
  }

  /**
   * Handle save preferences
   */
  private handleSave(): void {
    const checkboxes = this.element?.querySelectorAll('input[data-category]');

    // Initialize all configured categories to false
    const categories: ConsentCategories = { necessary: true, analytics: false, marketing: false };
    for (const key of Object.keys(this.config.categories)) {
      if (key !== 'necessary') {
        categories[key] = false;
      }
    }

    // Override with actual checkbox values
    checkboxes?.forEach((checkbox) => {
      if (checkbox instanceof HTMLInputElement) {
        const category = checkbox.getAttribute('data-category');
        if (category) {
          categories[category] = checkbox.checked;
        }
      }
    });

    this.eventEmitter.emit('consent:update', categories);
    this.hide();
  }

  /**
   * Handle reject all
   */
  private handleRejectAll(): void {
    const necessaryOnly: ConsentCategories = { necessary: true, analytics: false, marketing: false };

    for (const key of Object.keys(this.config.categories)) {
      if (key !== 'necessary') necessaryOnly[key] = false;
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

    firstFocusable?.focus();

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
}
