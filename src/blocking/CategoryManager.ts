/**
 * CategoryManager - Maps scripts to consent categories and manages patterns
 */

import { ConsentCategories } from '../types';

export class CategoryManager {
  private categories: Map<string, string[]> = new Map();

  constructor() {
    // Initialize with common patterns
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
    return consent[category as keyof ConsentCategories] === true;
  }

  /**
   * Initialize default URL patterns for common tracking services
   */
  private initializeDefaultPatterns(): void {
    this.categories.set('analytics', [
      'google-analytics.com',
      'googletagmanager.com',
      'analytics.google.com',
      'plausible.io',
      'matomo.org',
      'hotjar.com',
      'mixpanel.com',
      'segment.com',
      'amplitude.com',
    ]);

    this.categories.set('marketing', [
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
    ]);

    this.categories.set('necessary', []);
  }
}
