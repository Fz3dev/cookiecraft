/**
 * ScriptBlocker - Prevents scripts from executing before consent using MutationObserver
 */
import { ConsentCategories } from '../types';
import { CategoryManager } from './CategoryManager';
import { EventEmitter } from '../core/EventEmitter';
export declare class ScriptBlocker {
    private observer;
    private blockedScripts;
    private categoryManager;
    private eventEmitter;
    private currentConsent;
    constructor(categoryManager: CategoryManager, eventEmitter: EventEmitter);
    /**
     * Initialize script blocking
     */
    init(): void;
    /**
     * Block all scripts (reset consent)
     */
    block(): void;
    /**
     * Unblock scripts based on consent categories
     */
    unblock(categories: ConsentCategories): void;
    /**
     * Destroy the blocker and stop observing
     */
    destroy(): void;
    /**
     * Block all existing scripts with data-cookieconsent attribute
     */
    private blockExistingScripts;
    /**
     * Observe DOM for dynamically added scripts
     */
    private observeDOM;
    /**
     * Process a script element - block or allow based on consent
     */
    private processScript;
    /**
     * Reactivate a blocked script by creating a new one with correct type
     */
    private reactivateScript;
    /**
     * Generate unique ID for a script
     */
    private generateScriptId;
}
