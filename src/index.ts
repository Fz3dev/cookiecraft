/**
 * CookieCraft
 * Lightweight GDPR-compliant cookie consent library
 * Open-source alternative to Axept.io
 */

export { CookieConsent } from './core/CookieConsent';

// Export types for TypeScript users
export type {
  ConsentConfig,
  ConsentCategories,
  CategoryConfig,
  ConsentRecord,
  Translation,
  GTMConsent,
  ConsentEvent,
} from './types';

// Default export for UMD
export { CookieConsent as default } from './core/CookieConsent';
