/**
 * CategoryManager - Maps scripts to consent categories and manages patterns
 */

import { ConsentCategories } from '../types';

export class CategoryManager {
  private categories: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultPatterns();
  }

  /**
   * Register a category with URL patterns
   */
  public registerCategory(name: string, patterns: string[]): void {
    this.categories.set(name, patterns);
  }

  /**
   * Get category for a script element
   */
  public getCategoryForScript(script: HTMLScriptElement): string | null {
    // Explicit category attribute takes precedence
    const explicitCategory = script.getAttribute('data-cookieconsent');
    if (explicitCategory) {
      return explicitCategory;
    }

    // Try to match by src pattern
    const src = script.src;
    if (!src) return null;

    for (const [category, patterns] of this.categories) {
      if (patterns.some((pattern) => src.includes(pattern))) {
        return category;
      }
    }

    return null;
  }

  /**
   * Check if a category is allowed based on consent
   */
  public isAllowed(category: string, consent: ConsentCategories): boolean {
    return consent[category] === true;
  }

  /**
   * Initialize default URL patterns for common tracking services
   * Note: GTM is NOT auto-categorized — it should be managed via GTM Consent Mode v2
   */
  private initializeDefaultPatterns(): void {
    this.categories.set('analytics', [
      'google-analytics.com',
      'analytics.google.com',
      'plausible.io',
      'matomo.org',
      'hotjar.com',
      'mixpanel.com',
      'segment.com',
      'amplitude.com',
    ]);

    this.categories.set('marketing', [
      'googletagmanager.com',
      'facebook.net',
      'facebook.com/tr',
      'connect.facebook.net',
      'doubleclick.net',
      'ads.google.com',
      'linkedin.com/analytics',
      'twitter.com/i/adsct',
      'pinterest.com/ct',
      'adroll.com',
      'taboola.com',
      'outbrain.com',
      'tiktok.com',
    ]);

    this.categories.set('necessary', []);
  }
}
