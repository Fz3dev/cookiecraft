/**
 * ScriptBlocker - Prevents scripts from executing before consent using MutationObserver
 */

import { ConsentCategories } from '../types';
import { CategoryManager } from './CategoryManager';
import { EventEmitter } from '../core/EventEmitter';

export class ScriptBlocker {
  private observer: MutationObserver | null = null;
  private blockedScripts: Map<string, HTMLScriptElement> = new Map();
  private categoryManager: CategoryManager;
  private eventEmitter: EventEmitter;
  private currentConsent: ConsentCategories | null = null;

  constructor(categoryManager: CategoryManager, eventEmitter: EventEmitter) {
    this.categoryManager = categoryManager;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Initialize script blocking
   */
  public init(): void {
    // Block all existing scripts
    this.blockExistingScripts();

    // Watch for dynamically added scripts (GTM, etc.)
    this.observeDOM();
  }

  /**
   * Block all scripts (reset consent)
   */
  public block(): void {
    this.currentConsent = null;
    this.blockedScripts.clear();
    this.blockExistingScripts();
  }

  /**
   * Unblock scripts based on consent categories
   */
  public unblock(categories: ConsentCategories): void {
    this.currentConsent = categories;

    // Reactivate blocked scripts based on consent
    const toRemove: string[] = [];
    this.blockedScripts.forEach((script, id) => {
      const category = this.categoryManager.getCategoryForScript(script);
      if (category && this.categoryManager.isAllowed(category, categories)) {
        this.reactivateScript(script);
        toRemove.push(id);
      }
    });

    // Remove after iteration to avoid modifying map during forEach
    toRemove.forEach((id) => this.blockedScripts.delete(id));
  }

  /**
   * Destroy the blocker and stop observing
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Block all existing scripts with data-cookieconsent attribute
   */
  private blockExistingScripts(): void {
    const scripts = document.querySelectorAll('script[data-cookieconsent]');
    scripts.forEach((script) => {
      if (script instanceof HTMLScriptElement) {
        this.processScript(script);
      }
    });
  }

  /**
   * Observe DOM for dynamically added scripts
   */
  private observeDOM(): void {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (
            node instanceof HTMLScriptElement &&
            node.hasAttribute('data-cookieconsent')
          ) {
            this.processScript(node);
          }
        });
      });
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Process a script element - block or allow based on consent
   */
  private processScript(script: HTMLScriptElement): void {
    const category = this.categoryManager.getCategoryForScript(script);

    if (!category) return;

    // Check if consent allows this category
    if (
      this.currentConsent &&
      this.categoryManager.isAllowed(category, this.currentConsent)
    ) {
      // Already have consent, don't block
      return;
    }

    // Block the script by changing its type
    if (script.type !== 'text/plain') {
      const id = this.generateScriptId(script);

      // Don't re-block scripts we already know about
      if (this.blockedScripts.has(id)) return;

      // Store original type if it exists
      const originalType = script.type || 'text/javascript';
      script.setAttribute('data-original-type', originalType);

      script.type = 'text/plain';
      this.blockedScripts.set(id, script);
    }
  }

  /**
   * Reactivate a blocked script by creating a new one with correct type
   */
  private reactivateScript(script: HTMLScriptElement): void {
    // Clone script and change type to execute it
    const newScript = document.createElement('script');

    // Copy attributes
    Array.from(script.attributes).forEach((attr) => {
      if (attr.name !== 'type' && attr.name !== 'data-original-type') {
        newScript.setAttribute(attr.name, attr.value);
      }
    });

    // Set correct type
    const originalType = script.getAttribute('data-original-type') || 'text/javascript';
    newScript.type = originalType;

    // Copy content
    if (script.src) {
      newScript.src = script.src;
    } else {
      newScript.textContent = script.textContent;
    }

    // Replace old script
    if (script.parentNode) {
      script.parentNode.insertBefore(newScript, script);
      script.parentNode.removeChild(script);
    }

    this.eventEmitter.emit('script:activated', {
      category: script.getAttribute('data-cookieconsent'),
      src: script.src || 'inline',
    });
  }

  /**
   * Generate a stable, deterministic ID for a script element
   */
  private generateScriptId(script: HTMLScriptElement): string {
    // Use src for external scripts (stable across calls)
    if (script.src) {
      return `src:${script.src}`;
    }

    // For inline scripts, use a hash of the content for stability
    const content = script.textContent || '';
    const category = script.getAttribute('data-cookieconsent') || '';

    // Use existing data-cc-id if present (allows reset/re-block)
    const existingId = script.getAttribute('data-cc-id');
    if (existingId) return existingId;

    // Generate deterministic ID from content + category
    const id = `inline:${category}:${this.simpleHash(content)}`;
    script.setAttribute('data-cc-id', id);
    return id;
  }

  /**
   * Simple hash function for content-based script identification
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
}
