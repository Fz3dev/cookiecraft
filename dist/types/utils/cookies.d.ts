/**
 * Cookie utilities for clearing non-essential cookies on rejection/withdrawal
 */
/**
 * Clear cookies matching patterns for denied categories
 */
export declare function clearCookiesForCategory(category: string): void;
/**
 * Clear all non-essential cookies based on consent categories
 */
export declare function clearDeniedCookies(categories: Record<string, boolean>): void;
