/**
 * FloatingWidget - Permanent cookie settings button
 * Stays visible at all times for easy access to preferences
 */

import { ConsentConfig } from '../types';
import { EventEmitter } from '../core/EventEmitter';

export class FloatingWidget {
  private config: ConsentConfig;
  private element: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private isVisible: boolean = false;

  constructor(config: ConsentConfig, eventEmitter: EventEmitter) {
    this.config = config;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Show the floating widget
   */
  public show(): void {
    console.log('🎯 FloatingWidget.show() called');

    if (!this.element) {
      this.element = this.createDOM();
      document.body.appendChild(this.element);
      this.attachListeners();
      console.log('✅ Widget element created and appended to body');
    }

    // Delay to allow for transition
    requestAnimationFrame(() => {
      this.element?.classList.add('is-visible');
      this.isVisible = true;
      console.log('✅ Widget is-visible class added');
    });
  }

  /**
   * Hide the floating widget
   */
  public hide(): void {
    this.element?.classList.remove('is-visible');
    this.isVisible = false;
  }

  /**
   * Destroy the widget
   */
  public destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.isVisible = false;
  }

  /**
   * Check if widget is visible
   */
  public getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Create DOM structure for floating widget
   */
  private createDOM(): HTMLElement {
    const translations = this.config.translations || {};
    const theme = this.config.theme || 'light';
    const widgetPosition = this.config.widgetPosition || 'bottom-right';
    const widgetStyle = this.config.widgetStyle || 'full';

    console.log('🍪 Widget config:', { widgetPosition, widgetStyle, configWidgetStyle: this.config.widgetStyle });

    const template = `
      <div
        class="cc-widget cc-widget--${widgetPosition} cc-widget--${widgetStyle}"
        role="button"
        aria-label="${translations.cookieSettings || 'Paramètres des cookies'}"
        tabindex="0"
        data-theme="${theme}"
        style="${this.config.primaryColor ? `--cc-primary: ${this.config.primaryColor};` : ''}"
      >
        <svg class="cc-widget__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="7" cy="7" r="1.5"/>
          <circle cx="17" cy="7" r="1.5"/>
          <circle cx="7" cy="17" r="1.5"/>
          <circle cx="17" cy="17" r="1.5"/>
        </svg>
        <span class="cc-widget__text">
          ${translations.cookies || 'Cookies'}
        </span>
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
    this.element?.addEventListener('click', () => {
      this.handleClick();
    });

    this.element?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleClick();
      }
    });
  }

  /**
   * Handle widget click
   */
  private handleClick(): void {
    this.eventEmitter.emit('preferences:show');
  }
}
