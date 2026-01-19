/**
 * CategoryManager - Maps scripts to consent categories and manages patterns
 */
import { ConsentCategories } from '../types';
export declare class CategoryManager {
    private categories;
    constructor();
    /**
     * Register a category with URL patterns
     */
    registerCategory(name: string, patterns: string[]): void;
    /**
     * Get category for a script element
     */
    getCategoryForScript(script: HTMLScriptElement): string | null;
    /**
     * Check if a category is allowed based on consent
     */
    isAllowed(category: string, consent: ConsentCategories): boolean;
    /**
     * Initialize default URL patterns for common tracking services
     */
    private initializeDefaultPatterns;
}
