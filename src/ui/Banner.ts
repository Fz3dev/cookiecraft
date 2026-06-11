/**
 * Banner - Cookie consent banner component
 */

import { ConsentConfig, ConsentCategories } from "../types";
import { EventEmitter } from "../core/EventEmitter";
import { escapeHtml, sanitizeUrl, sanitizeColor } from "../utils/sanitize";
import { buildColorStyle } from "../utils/color";

export class Banner {
  private config: ConsentConfig;
  private element: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private previousActiveElement: HTMLElement | null = null;

  constructor(config: ConsentConfig, eventEmitter: EventEmitter) {
    this.config = config;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Show the banner
   */
  public show(): void {
    // Clear any pending hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    const append = () => {
      if (!this.element) {
        this.previousActiveElement =
          document.activeElement as HTMLElement | null;
        this.element = this.createDOM();
        document.body.appendChild(this.element);
        this.attachListeners();
      }

      // Trigger animation
      requestAnimationFrame(() => {
        this.element?.classList.add("is-visible");
      });

      // Disable page interaction if configured
      if (this.config.disablePageInteraction) {
        document.body.style.overflow = "hidden";
        this.trapFocus();
      }
    };

    if (!document.body) {
      document.addEventListener("DOMContentLoaded", append);
      return;
    }

    append();
  }

  /**
   * Hide the banner
   */
  public hide(): void {
    this.element?.classList.remove("is-visible");

    if (this.config.disablePageInteraction) {
      document.body.style.overflow = "";
    }

    this.hideTimeout = setTimeout(() => {
      this.destroy();
    }, 300);
  }

  /**
   * Destroy the banner
   */
  public destroy(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    // Restore focus
    if (
      this.previousActiveElement &&
      document.contains(this.previousActiveElement)
    ) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }

  /**
   * Create DOM structure for banner
   */
  private createDOM(): HTMLElement {
    const translations = this.config.translations || {};
    const theme = this.config.theme || "light";
    const position = this.config.position || "bottom";
    const layout = this.config.layout || "bar";
    const backdropBlur = this.config.backdropBlur !== false;
    const isModal = this.config.disablePageInteraction;

    const safeColor = this.config.primaryColor
      ? sanitizeColor(this.config.primaryColor)
      : "";
    const colorStyle = buildColorStyle(safeColor);

    const titleHtml = translations.title
      ? `<h2 class="cc-banner__title">${escapeHtml(translations.title)}</h2>`
      : "";

    const descriptionHtml = this.getDescriptionHTML();
    const descBlock = descriptionHtml
      ? `<p class="cc-banner__description">${descriptionHtml}</p>`
      : "";

    const template = `
      <div
        class="cc-banner cc-banner--${escapeHtml(position)} cc-banner--${escapeHtml(layout)} ${backdropBlur ? "cc-backdrop-blur" : ""}"
        role="${isModal ? "dialog" : "region"}"
        ${isModal ? 'aria-modal="true"' : ""}
        aria-label="Cookie consent"
        aria-live="polite"
        data-theme="${escapeHtml(theme)}"
        style="${colorStyle}"
      >
        <div class="cc-banner__container">
          <div class="cc-banner__content">
            ${titleHtml}
            ${descBlock}
          </div>
          <div class="cc-banner__actions">
            <button
              class="cc-btn cc-btn--accept"
              data-action="accept"
              aria-label="${escapeHtml(translations.acceptAll || "Accept all")}"
            >
              ${escapeHtml(translations.acceptAll || "Accept all")}
            </button>
            <button
              class="cc-btn cc-btn--reject"
              data-action="reject"
              aria-label="${escapeHtml(translations.rejectAll || "Reject all")}"
            >
              ${escapeHtml(translations.rejectAll || "Reject all")}
            </button>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = template.trim();
    return wrapper.firstChild as HTMLElement;
  }

  /**
   * Attach event listeners
   */
  private attachListeners(): void {
    this.element?.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest(
        "[data-action]",
      ) as HTMLElement | null;
      if (!target) return;
      const action = target.getAttribute("data-action");

      switch (action) {
        case "accept":
          this.handleAcceptAll();
          break;
        case "reject":
          this.handleRejectAll();
          break;
        case "customize":
          this.handleCustomize();
          break;
      }
    });

    this.element?.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.config.disablePageInteraction) {
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

    // Add all configured categories
    for (const key of Object.keys(this.config.categories)) {
      allCategories[key] = true;
    }

    this.eventEmitter.emit("consent:accept", allCategories);
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

    for (const key of Object.keys(this.config.categories)) {
      if (key !== "necessary") necessaryOnly[key] = false;
    }

    this.eventEmitter.emit("consent:reject", necessaryOnly);
    this.hide();
  }

  /**
   * Handle customize action
   */
  private handleCustomize(): void {
    this.eventEmitter.emit("preferences:show");
    this.hide();
  }

  /**
   * Trap focus within banner (when disablePageInteraction is true)
   */
  private trapFocus(): void {
    const focusableElements = this.element?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    firstFocusable?.focus();

    this.element?.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
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
   * Generate description HTML with privacy policy link
   */
  private getDescriptionHTML(): string {
    const translations = this.config.translations || {};

    if (!translations.description) return "";

    const description = escapeHtml(translations.description);
    const customizeLabel = escapeHtml(translations.customize || "Customize");

    let html = description;

    if (translations.privacyPolicyUrl) {
      const safeUrl = sanitizeUrl(translations.privacyPolicyUrl);
      if (safeUrl) {
        const linkLabel = escapeHtml(
          translations.privacyPolicyLabel || "Privacy Policy",
        );
        html += ` <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${linkLabel}</a>`;
      }
    }

    // Inline customize link at end of description
    html += ` <span class="cc-banner__customize" data-action="customize">${customizeLabel}</span>`;

    return html;
  }
}
