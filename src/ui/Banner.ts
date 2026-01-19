/**
 * Banner - Cookie consent banner component
 */

import { ConsentConfig, ConsentCategories } from '../types';
import { EventEmitter } from '../core/EventEmitter';

export class Banner {
  private config: ConsentConfig;
  private element: HTMLElement | null = null;
  private eventEmitter: EventEmitter;

  constructor(config: ConsentConfig, eventEmitter: EventEmitter) {
    this.config = config;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Show the banner
   */
  public show(): void {
    if (!this.element) {
      this.element = this.createDOM();
      document.body.appendChild(this.element);
      this.attachListeners();
    }

    // Trigger animation
    requestAnimationFrame(() => {
      this.element?.classList.add('is-visible');
    });

    // Focus first button for accessibility
    const firstButton = this.element?.querySelector('button');
    firstButton?.focus();

    // Disable page interaction if configured
    if (this.config.disablePageInteraction) {
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Hide the banner
   */
  public hide(): void {
    this.element?.classList.remove('is-visible');

    // Re-enable page interaction
    if (this.config.disablePageInteraction) {
      document.body.style.overflow = '';
    }

    setTimeout(() => {
      this.destroy();
    }, 300); // Match CSS transition
  }

  /**
   * Destroy the banner
   */
  public destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Create DOM structure for banner
   */
  private createDOM(): HTMLElement {
    const translations = this.config.translations || {};
    const theme = this.config.theme || 'light';
    const position = this.config.position || 'bottom';
    const layout = this.config.layout || 'bar';
    const backdropBlur = this.config.backdropBlur !== false;

    const template = `
      <div
        class="cc-banner cc-banner--${position} cc-banner--${layout} ${backdropBlur ? 'cc-backdrop-blur' : ''}"
        role="region"
        aria-label="Cookie consent"
        aria-live="polite"
        data-theme="${theme}"
        style="${this.config.primaryColor ? `--cc-primary: ${this.config.primaryColor};` : ''}"
      >
        <div class="cc-banner__container">
          <div class="cc-banner__content">
            <h2 class="cc-banner__title">
              ${translations.title || '🍪 Nous utilisons des cookies'}
            </h2>
            <p class="cc-banner__description">
              ${this.getDescriptionHTML()}
            </p>
          </div>
          <div class="cc-banner__actions">
            <button
              class="cc-btn cc-btn--secondary"
              data-action="reject"
              aria-label="Rejeter tous les cookies"
            >
              ${translations.rejectAll || 'Tout rejeter'}
            </button>
            <button
              class="cc-btn cc-btn--tertiary"
              data-action="customize"
              aria-label="Personnaliser les préférences"
            >
              ${translations.customize || 'Personnaliser'}
            </button>
            <button
              class="cc-btn cc-btn--primary"
              data-action="accept"
              aria-label="Accepter tous les cookies"
            >
              ${translations.acceptAll || 'Tout accepter'}
            </button>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = template.trim();
    return wrapper.firstChild as HTMLElement;
  }

  /**
   * Attach event listeners
   */
  private attachListeners(): void {
    this.element?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');

      switch (action) {
        case 'accept':
          this.handleAcceptAll();
          break;
        case 'reject':
          this.handleRejectAll();
          break;
        case 'customize':
          this.handleCustomize();
          break;
      }
    });

    // Keyboard support
    this.element?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.config.disablePageInteraction) {
        // Allow ESC to close if page interaction is disabled
        this.handleRejectAll();
      }
    });
  }

  /**
   * Handle accept all action
   */
  private handleAcceptAll(): void {
    const allCategories: ConsentCategories = {
      necessary: true,
      analytics: true,
      marketing: true,
    };

    // Only add preferences if it's configured
    if (this.config.categories.preferences) {
      allCategories.preferences = true;
    }

    this.eventEmitter.emit('consent:accept', allCategories);
    this.config.onAccept?.(allCategories);
    this.hide();
  }

  /**
   * Handle reject all action
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
    this.config.onReject?.();
    this.hide();
  }

  /**
   * Handle customize action
   */
  private handleCustomize(): void {
    this.eventEmitter.emit('preferences:show');
    this.hide();
  }

  /**
   * Generate description HTML with privacy policy link
   */
  private getDescriptionHTML(): string {
    const translations = this.config.translations || {};
    const defaultDescription = 'Pour améliorer votre expérience sur notre site, nous utilisons des cookies. Vous pouvez choisir les cookies que vous acceptez.';
    const description = translations.description || defaultDescription;

    if (translations.privacyPolicyUrl) {
      const linkLabel = translations.privacyPolicyLabel || 'Politique de confidentialité';
      return `${description} <a href="${translations.privacyPolicyUrl}" target="_blank" rel="noopener noreferrer">${linkLabel}</a>`;
    }

    return description;
  }
}
