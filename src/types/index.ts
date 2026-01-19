/**
 * Type definitions for CookieCraft
 */

export interface ConsentCategories {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences?: boolean;
}

export interface CategoryConfig {
  enabled: boolean;
  readOnly: boolean;
  label: string;
  description: string;
}

export interface Translation {
  title?: string;
  description?: string;
  acceptAll?: string;
  rejectAll?: string;
  customize?: string;
  savePreferences?: string;
  necessary?: string;
  analytics?: string;
  marketing?: string;
  preferences?: string;
  cookieSettings?: string;
  cookies?: string;
  privacyPolicyUrl?: string;
  privacyPolicyLabel?: string;
  preferencesTitle?: string;
}

export interface ConsentConfig {
  // Core settings
  mode: 'opt-in' | 'opt-out';
  autoShow: boolean;
  revision: number;

  // Categories
  categories: {
    necessary: CategoryConfig;
    analytics: CategoryConfig;
    marketing: CategoryConfig;
    preferences?: CategoryConfig;
  };

  // UI customization
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom' | 'top' | 'center' | 'bottom-left' | 'bottom-right';
  layout?: 'bar' | 'box' | 'floating';
  primaryColor?: string;
  backdropBlur?: boolean;
  animationStyle?: 'smooth' | 'minimal';

  // Preferences modal position
  preferencesPosition?: 'center' | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

  // Floating widget
  showWidget?: boolean;                  // Show permanent cookie settings button
  widgetPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

  // Content
  language?: string;
  translations?: Translation;

  // Integration
  gtmConsentMode?: boolean;
  cookieDomain?: string;

  // Accessibility
  disablePageInteraction?: boolean;

  // Callbacks
  onAccept?: (categories: ConsentCategories) => void;
  onReject?: () => void;
  onChange?: (categories: ConsentCategories) => void;
}

export interface ConsentRecord {
  version: number;
  timestamp: string;
  categories: ConsentCategories;
  userAgent: string;
  expiresAt: string;
}

export interface GTMConsent {
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
  functionality_storage: 'granted' | 'denied';
  personalization_storage: 'granted' | 'denied';
  security_storage: 'granted' | 'denied';
}

export type ConsentEvent =
  | 'consent:init'
  | 'consent:show'
  | 'consent:hide'
  | 'consent:accept'
  | 'consent:reject'
  | 'consent:update'
  | 'consent:load'
  | 'consent:expire'
  | 'preferences:show'
  | 'preferences:hide'
  | 'script:activated';

// Extend Window interface for GTM
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    cookieConsent?: any;
  }
}
