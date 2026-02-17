/**
 * FloatingWidget - Permanent cookie settings button
 * Stays visible at all times for easy access to preferences
 */

import { ConsentConfig } from '../types';
import { EventEmitter } from '../core/EventEmitter';
import { escapeHtml, sanitizeColor } from '../utils/sanitize';

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
    const append = () => {
      if (!this.element) {
        this.element = this.createDOM();
        document.body.appendChild(this.element);
        this.attachListeners();
      }

      // Delay to allow for transition
      requestAnimationFrame(() => {
        this.element?.classList.add('is-visible');
        this.isVisible = true;
      });
    };

    if (!document.body) {
      document.addEventListener('DOMContentLoaded', append);
      return;
    }
    append();
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

    const safeColor = this.config.primaryColor ? sanitizeColor(this.config.primaryColor) : '';
    const colorStyle = safeColor ? `--cc-primary: ${safeColor};` : '';

    const template = `
      <div
        class="cc-widget cc-widget--${escapeHtml(widgetPosition)} cc-widget--${escapeHtml(widgetStyle)}"
        role="button"
        aria-label="${escapeHtml(translations.cookieSettings || 'Paramètres des cookies')}"
        tabindex="0"
        data-theme="${escapeHtml(theme)}"
        style="${colorStyle}"
      >
        <svg class="cc-widget__icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path id="cc-ck-a" d="M6,9 C5.448,9 5,8.552 5,8 C5,7.448 5.448,7 6,7 C6.552,7 7,7.448 7,8 C7,8.552 6.552,9 6,9 Z M0.5,5 C0.776,5 1,5.224 1,5.5 C1,5.776 0.776,6 0.5,6 C0.224,6 0,5.776 0,5.5 C0,5.224 0.224,5 0.5,5 Z M1.5,0 C1.776,0 2,0.224 2,0.5 C2,0.776 1.776,1 1.5,1 C1.224,1 1,0.776 1,0.5 C1,0.224 1.224,0 1.5,0 Z"/>
            <path id="cc-ck-c" d="M16.899,14.984 C14.727,14.802 12.991,13.088 12.773,10.927 C10.117,10.808 8,8.617 8,5.932 C8,4.837 8.352,3.824 8.949,3 C5.027,3.515 2,6.87 2,10.932 C2,15.35 5.582,18.932 10,18.932 C12.939,18.932 15.509,17.346 16.899,14.984 Z M18.623,15.998 C16.839,19.029 13.583,20.932 10,20.932 C4.477,20.932 0,16.454 0,10.932 C0,5.897 3.74,1.666 8.689,1.017 C10.429,0.789 11.599,2.753 10.568,4.174 C10.2,4.682 10,5.289 10,5.932 C10,7.537 11.265,8.857 12.862,8.929 C13.854,8.973 14.663,9.738 14.763,10.726 C14.884,11.932 15.857,12.889 17.067,12.991 C18.535,13.114 19.37,14.729 18.623,15.998 Z M10,18 C8.343,18 7,16.657 7,15 C7,13.343 8.343,12 10,12 C11.657,12 13,13.343 13,15 C13,16.657 11.657,18 10,18 Z M10,16 C10.552,16 11,15.552 11,15 C11,14.448 10.552,14 10,14 C9.448,14 9,14.448 9,15 C9,15.552 9.448,16 10,16 Z M4.5,14 C3.672,14 3,13.328 3,12.5 C3,11.672 3.672,11 4.5,11 C5.328,11 6,11.672 6,12.5 C6,13.328 5.328,14 4.5,14 Z M4.5,12 C4.224,12 4,12.224 4,12.5 C4,12.776 4.224,13 4.5,13 C4.776,13 5,12.776 5,12.5 C5,12.224 4.776,12 4.5,12 Z M5.5,9 C4.672,9 4,8.328 4,7.5 C4,6.672 4.672,6 5.5,6 C6.328,6 7,6.672 7,7.5 C7,8.328 6.328,9 5.5,9 Z M5.5,7 C5.224,7 5,7.224 5,7.5 C5,7.776 5.224,8 5.5,8 C5.776,8 6,7.776 6,7.5 C6,7.224 5.776,7 5.5,7 Z"/>
          </defs>
          <g fill="currentColor" fill-rule="evenodd" transform="translate(3 1)">
            <g transform="translate(4 7)">
              <use href="#cc-ck-a"/>
            </g>
            <use href="#cc-ck-c"/>
          </g>
        </svg>
        <span class="cc-widget__text">
          ${escapeHtml(translations.cookies || 'Cookies')}
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
