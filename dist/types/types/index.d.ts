/**
 * Type definitions for CookieCraft
 */
export interface ConsentCategories {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences?: boolean;
    [key: string]: boolean | undefined;
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
    essentialsOnly?: string;
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
    autoShow: boolean;
    revision: number;
    consentExpiryMonths?: number;
    categories: Record<string, CategoryConfig>;
    theme?: "light" | "dark" | "auto";
    position?: "bottom" | "top" | "center" | "bottom-left" | "bottom-right";
    layout?: "bar" | "box" | "floating";
    primaryColor?: string;
    backdropBlur?: boolean;
    animationStyle?: "smooth" | "minimal";
    preferencesPosition?: "center" | "bottom-left" | "bottom-right" | "top-left" | "top-right";
    showWidget?: boolean;
    widgetPosition?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
    widgetStyle?: "compact" | "full";
    language?: string;
    translations?: Translation;
    gtmConsentMode?: boolean;
    gtmWaitForUpdate?: number;
    gtmUrlPassthrough?: boolean;
    gtmAdsDataRedaction?: boolean;
    cookieDomain?: string;
    disablePageInteraction?: boolean;
    onAccept?: (categories: ConsentCategories) => void;
    onReject?: () => void;
    onChange?: (categories: ConsentCategories) => void;
}
export interface ConsentRecord {
    version: number;
    timestamp: string;
    categories: ConsentCategories;
    expiresAt: string;
}
export interface GTMConsent {
    [key: string]: "granted" | "denied";
    ad_storage: "granted" | "denied";
    ad_user_data: "granted" | "denied";
    ad_personalization: "granted" | "denied";
    analytics_storage: "granted" | "denied";
    functionality_storage: "granted" | "denied";
    personalization_storage: "granted" | "denied";
    security_storage: "granted" | "denied";
}
export type EventCallback = (...args: any[]) => void;
export type ConsentEvent = "consent:init" | "consent:show" | "consent:hide" | "consent:accept" | "consent:reject" | "consent:update" | "consent:load" | "consent:expire" | "preferences:show" | "preferences:hide" | "script:activated";
declare global {
    interface Window {
        dataLayer?: any[];
        gtag?: (...args: any[]) => void;
        cookieConsent?: any;
    }
}
