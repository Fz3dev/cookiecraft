(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CookieCraft = {}));
})(this, (function (exports) { 'use strict';

    /**
     * StorageManager - Manages localStorage persistence for consent records
     */
    class StorageManager {
        /**
         * Save consent record to localStorage
         */
        save(consent) {
            try {
                localStorage.setItem(StorageManager.STORAGE_KEY, JSON.stringify(consent));
            }
            catch (e) {
                console.error('Failed to save consent:', e);
            }
        }
        /**
         * Load consent record from localStorage
         */
        load() {
            try {
                const data = localStorage.getItem(StorageManager.STORAGE_KEY);
                if (!data)
                    return null;
                const parsed = JSON.parse(data);
                // Validate schema
                if (!this.validateSchema(parsed)) {
                    // Try migration
                    const migrated = this.migrate(parsed);
                    if (migrated) {
                        this.save(migrated);
                        return migrated;
                    }
                    return null;
                }
                return parsed;
            }
            catch (e) {
                console.error('Failed to load consent:', e);
                return null;
            }
        }
        /**
         * Clear consent record from localStorage
         */
        clear() {
            localStorage.removeItem(StorageManager.STORAGE_KEY);
        }
        /**
         * Check if consent record has expired
         */
        isExpired(consent) {
            const expiry = new Date(consent.expiresAt);
            return expiry < new Date();
        }
        /**
         * Validate consent record schema
         */
        validateSchema(data) {
            return (data &&
                typeof data.version === 'number' &&
                typeof data.timestamp === 'string' &&
                typeof data.categories === 'object' &&
                typeof data.userAgent === 'string' &&
                typeof data.expiresAt === 'string');
        }
        /**
         * Migrate old consent format to new format
         * Returns null if migration fails
         */
        migrate(data) {
            if (!data || typeof data !== 'object')
                return null;
            const record = data;
            // Attempt to reconstruct a valid record from partial data
            if (record.categories && typeof record.categories === 'object') {
                const now = new Date();
                const expiryDate = new Date(now);
                expiryDate.setMonth(expiryDate.getMonth() + StorageManager.EXPIRY_MONTHS);
                return {
                    version: typeof record.version === 'number' ? record.version : 1,
                    timestamp: typeof record.timestamp === 'string' ? record.timestamp : now.toISOString(),
                    categories: record.categories,
                    userAgent: typeof record.userAgent === 'string' ? record.userAgent : navigator.userAgent,
                    expiresAt: typeof record.expiresAt === 'string' ? record.expiresAt : expiryDate.toISOString(),
                };
            }
            return null;
        }
    }
    StorageManager.STORAGE_KEY = 'cookiecraft_consent';
    StorageManager.EXPIRY_MONTHS = 13;

    /**
     * ConsentManager - Handles consent logic and validation
     */
    class ConsentManager {
        constructor(config) {
            this.config = config;
        }
        /**
         * Validate consent categories
         */
        validateConsent(categories) {
            // Necessary cookies must always be enabled
            if (!categories.necessary) {
                return false;
            }
            // Validate against config
            for (const key of Object.keys(categories)) {
                if (!(key in this.config.categories)) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Update consent with new categories
         */
        updateConsent(categories) {
            if (!this.validateConsent(categories)) {
                throw new Error('Invalid consent categories');
            }
            this.consent = this.createConsentRecord(categories);
            return this.consent;
        }
        /**
         * Check if user needs to give consent
         */
        needsConsent() {
            return this.consent === undefined;
        }
        /**
         * Check if stored consent needs update due to policy change
         */
        needsUpdate(storedConsent) {
            // Check if policy version has changed
            return storedConsent.version < this.config.revision;
        }
        /**
         * Get current consent record
         */
        getCurrentConsent() {
            return this.consent;
        }
        /**
         * Create a new consent record
         */
        createConsentRecord(categories) {
            const now = new Date();
            const expiryDate = new Date(now);
            expiryDate.setMonth(expiryDate.getMonth() + StorageManager.EXPIRY_MONTHS);
            return {
                version: this.config.revision,
                timestamp: now.toISOString(),
                categories: Object.assign({}, categories),
                userAgent: navigator.userAgent,
                expiresAt: expiryDate.toISOString(),
            };
        }
    }

    /**
     * EventEmitter - Simple pub/sub pattern for internal and external events
     */
    class EventEmitter {
        constructor() {
            this.events = new Map();
        }
        /**
         * Register an event handler
         */
        on(event, callback) {
            if (!this.events.has(event)) {
                this.events.set(event, new Set());
            }
            this.events.get(event).add(callback);
        }
        /**
         * Unregister an event handler
         */
        off(event, callback) {
            if (this.events.has(event)) {
                this.events.get(event).delete(callback);
            }
        }
        /**
         * Emit an event with optional data
         */
        emit(event, data) {
            if (this.events.has(event)) {
                this.events.get(event).forEach((callback) => {
                    try {
                        callback(data);
                    }
                    catch (e) {
                        console.error(`Error in event handler for ${event}:`, e);
                    }
                });
            }
        }
        /**
         * Clear all event handlers
         */
        clear() {
            this.events.clear();
        }
        /**
         * Clear handlers for a specific event
         */
        clearEvent(event) {
            this.events.delete(event);
        }
    }

    /**
     * ScriptBlocker - Prevents scripts from executing before consent using MutationObserver
     */
    class ScriptBlocker {
        constructor(categoryManager, eventEmitter) {
            this.observer = null;
            this.blockedScripts = new Map();
            this.currentConsent = null;
            this.categoryManager = categoryManager;
            this.eventEmitter = eventEmitter;
        }
        /**
         * Initialize script blocking
         */
        init() {
            // Block all existing scripts
            this.blockExistingScripts();
            // Watch for dynamically added scripts (GTM, etc.)
            this.observeDOM();
        }
        /**
         * Block all scripts (reset consent)
         */
        block() {
            this.currentConsent = null;
            this.blockedScripts.clear();
            this.blockExistingScripts();
        }
        /**
         * Unblock scripts based on consent categories
         */
        unblock(categories) {
            this.currentConsent = categories;
            // Reactivate blocked scripts based on consent
            const toRemove = [];
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
        destroy() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }
        /**
         * Block all existing scripts with data-cookieconsent attribute
         */
        blockExistingScripts() {
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
        observeDOM() {
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLScriptElement &&
                            node.hasAttribute('data-cookieconsent')) {
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
        processScript(script) {
            const category = this.categoryManager.getCategoryForScript(script);
            if (!category)
                return;
            // Check if consent allows this category
            if (this.currentConsent &&
                this.categoryManager.isAllowed(category, this.currentConsent)) {
                // Already have consent, don't block
                return;
            }
            // Block the script by changing its type
            if (script.type !== 'text/plain') {
                const id = this.generateScriptId(script);
                // Don't re-block scripts we already know about
                if (this.blockedScripts.has(id))
                    return;
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
        reactivateScript(script) {
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
            }
            else {
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
        generateScriptId(script) {
            // Use src for external scripts (stable across calls)
            if (script.src) {
                return `src:${script.src}`;
            }
            // For inline scripts, use a hash of the content for stability
            const content = script.textContent || '';
            const category = script.getAttribute('data-cookieconsent') || '';
            // Use existing data-cc-id if present (allows reset/re-block)
            const existingId = script.getAttribute('data-cc-id');
            if (existingId)
                return existingId;
            // Generate deterministic ID from content + category
            const id = `inline:${category}:${this.simpleHash(content)}`;
            script.setAttribute('data-cc-id', id);
            return id;
        }
        /**
         * Simple hash function for content-based script identification
         */
        simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash |= 0; // Convert to 32bit integer
            }
            return hash.toString(36);
        }
    }

    /**
     * CategoryManager - Maps scripts to consent categories and manages patterns
     */
    class CategoryManager {
        constructor() {
            this.categories = new Map();
            // Initialize with common patterns
            this.initializeDefaultPatterns();
        }
        /**
         * Register a category with URL patterns
         */
        registerCategory(name, patterns) {
            this.categories.set(name, patterns);
        }
        /**
         * Get category for a script element
         */
        getCategoryForScript(script) {
            // Explicit category attribute takes precedence
            const explicitCategory = script.getAttribute('data-cookieconsent');
            if (explicitCategory) {
                return explicitCategory;
            }
            // Try to match by src pattern
            const src = script.src;
            if (!src)
                return null;
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
        isAllowed(category, consent) {
            return consent[category] === true;
        }
        /**
         * Initialize default URL patterns for common tracking services
         */
        initializeDefaultPatterns() {
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

    /**
     * Sanitization utilities to prevent XSS in HTML templates
     */
    const HTML_ESCAPE_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
    };
    const HTML_ESCAPE_RE = /[&<>"'`]/g;
    /**
     * Escape HTML entities in a string to prevent XSS
     */
    function escapeHtml(str) {
        return str.replace(HTML_ESCAPE_RE, (char) => HTML_ESCAPE_MAP[char] || char);
    }
    /**
     * Sanitize a URL - only allow http(s) and relative URLs
     */
    function sanitizeUrl(url) {
        const trimmed = url.trim();
        if (trimmed.startsWith('https://') ||
            trimmed.startsWith('http://') ||
            trimmed.startsWith('/') ||
            trimmed.startsWith('./')) {
            return escapeHtml(trimmed);
        }
        return '';
    }
    /**
     * Sanitize a CSS color value - only allow valid hex, rgb, hsl, named colors
     */
    function sanitizeColor(color) {
        const trimmed = color.trim();
        // Allow hex colors
        if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed))
            return trimmed;
        // Allow rgb/rgba
        if (/^rgba?\(\s*[\d\s,./%]+\)$/.test(trimmed))
            return trimmed;
        // Allow hsl/hsla
        if (/^hsla?\(\s*[\d\s,./%deg]+\)$/.test(trimmed))
            return trimmed;
        // Allow CSS named colors (basic set)
        if (/^[a-zA-Z]+$/.test(trimmed))
            return trimmed;
        return '';
    }

    /**
     * Adjust a hex color brightness by a percentage
     * Negative = darker, positive = lighter
     */
    function adjustColorBrightness(color, percent) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const adjust = (value) => {
            const adjusted = value + (value * percent / 100);
            return Math.max(0, Math.min(255, Math.round(adjusted)));
        };
        const toHex = (value) => {
            const h = value.toString(16);
            return h.length === 1 ? '0' + h : h;
        };
        return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
    }
    /**
     * Build inline CSS custom properties for a primary color
     */
    function buildColorStyle(safeColor) {
        if (!safeColor)
            return '';
        const hover = adjustColorBrightness(safeColor, -15);
        return `--cc-primary: ${safeColor}; --cc-primary-hover: ${hover};`;
    }

    /**
     * Banner - Cookie consent banner component
     */
    class Banner {
        constructor(config, eventEmitter) {
            this.element = null;
            this.config = config;
            this.eventEmitter = eventEmitter;
        }
        /**
         * Show the banner
         */
        show() {
            const append = () => {
                if (!this.element) {
                    this.element = this.createDOM();
                    document.body.appendChild(this.element);
                    this.attachListeners();
                }
                // Trigger animation
                requestAnimationFrame(() => {
                    var _a;
                    (_a = this.element) === null || _a === void 0 ? void 0 : _a.classList.add('is-visible');
                });
                // Disable page interaction if configured
                if (this.config.disablePageInteraction) {
                    document.body.style.overflow = 'hidden';
                }
            };
            // Wait for body if not yet available
            if (!document.body) {
                document.addEventListener('DOMContentLoaded', append);
                return;
            }
            append();
        }
        /**
         * Hide the banner
         */
        hide() {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.classList.remove('is-visible');
            // Re-enable page interaction
            if (this.config.disablePageInteraction) {
                document.body.style.overflow = '';
            }
            setTimeout(() => {
                this.destroy();
            }, 300); // Match CSS transition
        }
        /**
         * Destroy the banner
         */
        destroy() {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
        }
        /**
         * Create DOM structure for banner
         */
        createDOM() {
            const translations = this.config.translations || {};
            const theme = this.config.theme || 'light';
            const position = this.config.position || 'bottom';
            const layout = this.config.layout || 'bar';
            const backdropBlur = this.config.backdropBlur !== false;
            const safeColor = this.config.primaryColor ? sanitizeColor(this.config.primaryColor) : '';
            const colorStyle = buildColorStyle(safeColor);
            const template = `
      <div
        class="cc-banner cc-banner--${escapeHtml(position)} cc-banner--${escapeHtml(layout)} ${backdropBlur ? 'cc-backdrop-blur' : ''}"
        role="region"
        aria-label="Cookie consent"
        aria-live="polite"
        data-theme="${escapeHtml(theme)}"
        style="${colorStyle}"
      >
        <div class="cc-banner__container">
          <div class="cc-banner__content">
            <h2 class="cc-banner__title">
              ${escapeHtml(translations.title || '🍪 Nous utilisons des cookies')}
            </h2>
            <p class="cc-banner__description">
              ${this.getDescriptionHTML()}
            </p>
          </div>
          <div class="cc-banner__actions">
            <button
              class="cc-btn cc-btn--ghost"
              data-action="reject"
              aria-label="${escapeHtml(translations.rejectAll || 'Uniquement essentiels')}"
            >
              ${escapeHtml(translations.rejectAll || 'Uniquement essentiels')}
            </button>
            <button
              class="cc-btn cc-btn--tertiary"
              data-action="customize"
              aria-label="${escapeHtml(translations.customize || 'Personnaliser')}"
            >
              ${escapeHtml(translations.customize || 'Personnaliser')}
            </button>
            <button
              class="cc-btn cc-btn--accept"
              data-action="accept"
              aria-label="${escapeHtml(translations.acceptAll || 'Tout accepter')}"
            >
              ${escapeHtml(translations.acceptAll || 'Tout accepter')}
            </button>
          </div>
        </div>
      </div>
    `;
            const wrapper = document.createElement('div');
            wrapper.innerHTML = template.trim();
            return wrapper.firstChild;
        }
        /**
         * Attach event listeners
         */
        attachListeners() {
            var _a, _b;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target)
                    return;
                const action = target.getAttribute('data-action');
                switch (action) {
                    case 'accept':
                        this.handleAcceptAll();
                        break;
                    case 'reject':
                        this.handleRejectAll();
                        break;
                    case 'customize':
                        this.handleCustomize();
                        break;
                }
            });
            // Keyboard support
            (_b = this.element) === null || _b === void 0 ? void 0 : _b.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.config.disablePageInteraction) {
                    // Allow ESC to close if page interaction is disabled
                    this.handleRejectAll();
                }
            });
        }
        /**
         * Handle accept all action
         */
        handleAcceptAll() {
            var _a, _b;
            const allCategories = {
                necessary: true,
                analytics: true,
                marketing: true,
            };
            // Only add preferences if it's configured
            if (this.config.categories.preferences) {
                allCategories.preferences = true;
            }
            this.eventEmitter.emit('consent:accept', allCategories);
            (_b = (_a = this.config).onAccept) === null || _b === void 0 ? void 0 : _b.call(_a, allCategories);
            this.hide();
        }
        /**
         * Handle reject all action
         */
        handleRejectAll() {
            var _a, _b;
            const necessaryOnly = {
                necessary: true,
                analytics: false,
                marketing: false,
            };
            // Only add preferences if it's configured
            if (this.config.categories.preferences) {
                necessaryOnly.preferences = false;
            }
            this.eventEmitter.emit('consent:reject', necessaryOnly);
            (_b = (_a = this.config).onReject) === null || _b === void 0 ? void 0 : _b.call(_a);
            this.hide();
        }
        /**
         * Handle customize action
         */
        handleCustomize() {
            this.eventEmitter.emit('preferences:show');
            this.hide();
        }
        /**
         * Generate description HTML with privacy policy link
         */
        getDescriptionHTML() {
            const translations = this.config.translations || {};
            const defaultDescription = 'Pour améliorer votre expérience sur notre site, nous utilisons des cookies. Vous pouvez choisir les cookies que vous acceptez.';
            const description = escapeHtml(translations.description || defaultDescription);
            if (translations.privacyPolicyUrl) {
                const safeUrl = sanitizeUrl(translations.privacyPolicyUrl);
                if (safeUrl) {
                    const linkLabel = escapeHtml(translations.privacyPolicyLabel || 'Politique de confidentialité');
                    return `${description} <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${linkLabel}</a>`;
                }
            }
            return description;
        }
    }

    /**
     * PreferenceCenter - Modal for granular cookie preferences
     */
    class PreferenceCenter {
        constructor(config, eventEmitter, currentConsent) {
            this.element = null;
            this.config = config;
            this.eventEmitter = eventEmitter;
            this.currentConsent = currentConsent;
        }
        /**
         * Show the preference center
         */
        show() {
            const append = () => {
                if (!this.element) {
                    this.element = this.createDOM();
                    document.body.appendChild(this.element);
                    this.attachListeners();
                }
                this.element.classList.add('is-visible');
                this.trapFocus();
                // Prevent body scroll
                document.body.style.overflow = 'hidden';
            };
            if (!document.body) {
                document.addEventListener('DOMContentLoaded', append);
                return;
            }
            append();
        }
        /**
         * Hide the preference center
         */
        hide() {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.classList.remove('is-visible');
            document.body.style.overflow = '';
            setTimeout(() => {
                this.destroy();
            }, 300);
        }
        /**
         * Destroy the preference center
         */
        destroy() {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
        }
        /**
         * Create DOM structure for preference center
         */
        createDOM() {
            const translations = this.config.translations || {};
            const theme = this.config.theme || 'light';
            const position = this.config.preferencesPosition || 'center';
            const safeColor = this.config.primaryColor ? sanitizeColor(this.config.primaryColor) : '';
            const colorStyle = buildColorStyle(safeColor);
            const privacyLinkHtml = translations.privacyPolicyUrl
                ? (() => {
                    const safeUrl = sanitizeUrl(translations.privacyPolicyUrl);
                    if (!safeUrl)
                        return '';
                    return `
            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="cc-privacy-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              ${escapeHtml(translations.privacyPolicyLabel || 'Politique de confidentialité')}
            </a>
          `;
                })()
                : '';
            const template = `
      <div
        class="cc-modal cc-modal--${escapeHtml(position)}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-modal-title"
        data-theme="${escapeHtml(theme)}"
        style="${colorStyle}"
      >
        <div class="cc-modal__overlay" data-action="close"></div>
        <div class="cc-modal__content">
          <div class="cc-modal__header">
            <h2 id="cc-modal-title">
              ${escapeHtml(translations.preferencesTitle || translations.title || 'Préférences de cookies')}
            </h2>
            <button
              class="cc-modal__close"
              aria-label="Fermer"
              data-action="close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="cc-modal__body">
            ${this.renderCategories()}
          </div>

          <div class="cc-modal__footer">
            <div class="cc-modal__footer-links">
              ${privacyLinkHtml}
            </div>
            <div class="cc-modal__footer-actions">
              <button
                class="cc-btn cc-btn--secondary"
                data-action="reject"
              >
                ${escapeHtml(translations.essentialsOnly || 'Uniquement les essentiels')}
              </button>
              <button
                class="cc-btn cc-btn--primary"
                data-action="save"
              >
                ${escapeHtml(translations.savePreferences || 'Enregistrer mes choix')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
            const wrapper = document.createElement('div');
            wrapper.innerHTML = template.trim();
            return wrapper.firstChild;
        }
        /**
         * Render category toggles
         */
        renderCategories() {
            const categories = Object.entries(this.config.categories);
            return categories
                .map(([key, config]) => {
                const checked = this.currentConsent[key];
                const disabled = config.readOnly;
                return `
        <div class="cc-category">
          <div class="cc-category__header">
            <label class="cc-toggle ${disabled ? 'cc-toggle--disabled' : ''}">
              <input
                type="checkbox"
                data-category="${escapeHtml(key)}"
                ${checked ? 'checked' : ''}
                ${disabled ? 'disabled' : ''}
                aria-label="${escapeHtml(config.label)} cookies"
              >
              <span class="cc-toggle__slider"></span>
            </label>
            <div class="cc-category__info">
              <h3>${escapeHtml(config.label)}</h3>
              <p>${escapeHtml(config.description)}</p>
            </div>
          </div>
        </div>
      `;
            })
                .join('');
        }
        /**
         * Attach event listeners
         */
        attachListeners() {
            var _a, _b;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target)
                    return;
                const action = target.getAttribute('data-action');
                if (action === 'close') {
                    this.hide();
                }
                else if (action === 'save') {
                    this.handleSave();
                }
                else if (action === 'reject') {
                    this.handleRejectAll();
                }
            });
            // Keyboard shortcuts
            (_b = this.element) === null || _b === void 0 ? void 0 : _b.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hide();
                }
            });
        }
        /**
         * Handle save preferences
         */
        handleSave() {
            var _a, _b, _c;
            const checkboxes = (_a = this.element) === null || _a === void 0 ? void 0 : _a.querySelectorAll('input[data-category]');
            const categories = {
                necessary: true,
                analytics: false,
                marketing: false,
            };
            checkboxes === null || checkboxes === void 0 ? void 0 : checkboxes.forEach((checkbox) => {
                if (checkbox instanceof HTMLInputElement) {
                    const category = checkbox.getAttribute('data-category');
                    if (category) {
                        categories[category] = checkbox.checked;
                    }
                }
            });
            this.eventEmitter.emit('consent:update', categories);
            (_c = (_b = this.config).onChange) === null || _c === void 0 ? void 0 : _c.call(_b, categories);
            this.hide();
        }
        /**
         * Handle reject all
         */
        handleRejectAll() {
            const necessaryOnly = {
                necessary: true,
                analytics: false,
                marketing: false,
            };
            // Only add preferences if it's configured
            if (this.config.categories.preferences) {
                necessaryOnly.preferences = false;
            }
            this.eventEmitter.emit('consent:reject', necessaryOnly);
            this.hide();
        }
        /**
         * Trap focus within modal
         */
        trapFocus() {
            var _a, _b;
            const focusableElements = (_a = this.element) === null || _a === void 0 ? void 0 : _a.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (!focusableElements || focusableElements.length === 0)
                return;
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            // Focus first element
            firstFocusable === null || firstFocusable === void 0 ? void 0 : firstFocusable.focus();
            // Trap focus
            (_b = this.element) === null || _b === void 0 ? void 0 : _b.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                    else if (!e.shiftKey && document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            });
        }
    }

    /**
     * FloatingWidget - Permanent cookie settings button
     * Stays visible at all times for easy access to preferences
     */
    class FloatingWidget {
        constructor(config, eventEmitter) {
            this.element = null;
            this.isVisible = false;
            this.config = config;
            this.eventEmitter = eventEmitter;
        }
        /**
         * Show the floating widget
         */
        show() {
            const append = () => {
                if (!this.element) {
                    this.element = this.createDOM();
                    document.body.appendChild(this.element);
                    this.attachListeners();
                }
                // Delay to allow for transition
                requestAnimationFrame(() => {
                    var _a;
                    (_a = this.element) === null || _a === void 0 ? void 0 : _a.classList.add('is-visible');
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
        hide() {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.classList.remove('is-visible');
            this.isVisible = false;
        }
        /**
         * Destroy the widget
         */
        destroy() {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
            this.isVisible = false;
        }
        /**
         * Check if widget is visible
         */
        getIsVisible() {
            return this.isVisible;
        }
        /**
         * Create DOM structure for floating widget
         */
        createDOM() {
            const translations = this.config.translations || {};
            const theme = this.config.theme || 'light';
            const widgetPosition = this.config.widgetPosition || 'bottom-right';
            const widgetStyle = this.config.widgetStyle || 'full';
            const safeColor = this.config.primaryColor ? sanitizeColor(this.config.primaryColor) : '';
            const colorStyle = buildColorStyle(safeColor);
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
            return wrapper.firstChild;
        }
        /**
         * Attach event listeners
         */
        attachListeners() {
            var _a, _b;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
                this.handleClick();
            });
            (_b = this.element) === null || _b === void 0 ? void 0 : _b.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleClick();
                }
            });
        }
        /**
         * Handle widget click
         */
        handleClick() {
            this.eventEmitter.emit('preferences:show');
        }
    }

    /**
     * GTMConsentMode - Full integration with Google Consent Mode v2
     *
     * Implements all required signals:
     * - ad_storage, ad_user_data, ad_personalization, analytics_storage (core GCM v2)
     * - functionality_storage, personalization_storage, security_storage (non-core)
     * - wait_for_update, url_passthrough, ads_data_redaction (advanced features)
     */
    class GTMConsentMode {
        constructor(dataLayerManager, config) {
            this.dataLayerManager = dataLayerManager;
            this.config = config;
        }
        /**
         * Set default consent state (MUST be called BEFORE GTM loads)
         * All non-essential consent types default to 'denied' per GDPR
         */
        setDefaultConsent() {
            var _a;
            const defaults = {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied',
                functionality_storage: 'denied',
                personalization_storage: 'denied',
                security_storage: 'granted', // Always granted
            };
            // Add wait_for_update to give CMP time to restore returning visitor consent
            const waitForUpdate = (_a = this.config.gtmWaitForUpdate) !== null && _a !== void 0 ? _a : 500;
            if (waitForUpdate > 0) {
                defaults['wait_for_update'] = waitForUpdate;
            }
            this.dataLayerManager.pushConsent('default', defaults);
            // Set advanced features via gtag('set', ...)
            if (this.config.gtmUrlPassthrough) {
                this.dataLayerManager.pushSet('url_passthrough', true);
            }
            if (this.config.gtmAdsDataRedaction) {
                this.dataLayerManager.pushSet('ads_data_redaction', true);
            }
        }
        /**
         * Update consent state based on user choices
         * Called both on new consent and on page load for returning visitors
         */
        updateConsent(categories) {
            const gtmConsent = this.mapCategoriesToGTM(categories);
            this.dataLayerManager.pushConsent('update', gtmConsent);
        }
        /**
         * Map consent categories to GTM Consent Mode v2 format
         */
        mapCategoriesToGTM(categories) {
            return {
                ad_storage: categories.marketing ? 'granted' : 'denied',
                ad_user_data: categories.marketing ? 'granted' : 'denied',
                ad_personalization: categories.marketing ? 'granted' : 'denied',
                analytics_storage: categories.analytics ? 'granted' : 'denied',
                functionality_storage: categories.preferences ? 'granted' : 'denied',
                personalization_storage: categories.preferences ? 'granted' : 'denied',
                security_storage: 'granted', // Always granted
            };
        }
    }

    /**
     * DataLayerManager - Manages Google Tag Manager dataLayer communication
     * Implements Google Consent Mode v2 correctly via gtag() API
     */
    class DataLayerManager {
        /**
         * Initialize gtag function if not already present
         * This must be called before GTM loads for consent defaults to work
         */
        ensureGtag() {
            window.dataLayer = window.dataLayer || [];
            if (typeof window.gtag !== 'function') {
                window.gtag = function () {
                    window.dataLayer.push(arguments);
                };
            }
        }
        /**
         * Push consent command via gtag (correct format for Google Consent Mode v2)
         * Usage: pushConsent('default', {...}) or pushConsent('update', {...})
         */
        pushConsent(action, params) {
            this.ensureGtag();
            window.gtag('consent', action, params);
        }
        /**
         * Push a 'set' command via gtag for advanced features
         * Usage: pushSet('url_passthrough', true) or pushSet('ads_data_redaction', true)
         */
        pushSet(key, value) {
            this.ensureGtag();
            window.gtag('set', key, value);
        }
    }

    /**
     * Cookie utilities for clearing non-essential cookies on rejection/withdrawal
     */
    /** Known analytics cookie name patterns */
    const ANALYTICS_COOKIE_PATTERNS = [
        /^_ga/, // Google Analytics
        /^_gid/, // Google Analytics
        /^_gat/, // Google Analytics
        /^_gcl/, // Google Ads conversion linker
        /^_hj/, // Hotjar
        /^_pk_/, // Matomo/Piwik
        /^mp_/, // Mixpanel
        /^ajs_/, // Segment
        /^amplitude/, // Amplitude
        /^plausible/, // Plausible
    ];
    /** Known marketing cookie name patterns */
    const MARKETING_COOKIE_PATTERNS = [
        /^_fbp/, // Facebook Pixel
        /^_fbc/, // Facebook click
        /^fr$/, // Facebook
        /^_pin_/, // Pinterest
        /^_tt_/, // TikTok
        /^li_/, // LinkedIn
        /^_uet/, // Microsoft/Bing Ads
        /^IDE$/, // DoubleClick
        /^test_cookie/, // DoubleClick
        /^MUID$/, // Microsoft
        /^NID$/, // Google Ads
    ];
    /** Known preferences cookie name patterns */
    const PREFERENCES_COOKIE_PATTERNS = [
        /^lang$/,
        /^locale$/,
        /^i18n/,
    ];
    const CATEGORY_PATTERNS = {
        analytics: ANALYTICS_COOKIE_PATTERNS,
        marketing: MARKETING_COOKIE_PATTERNS,
        preferences: PREFERENCES_COOKIE_PATTERNS,
    };
    /**
     * Get all cookies as name/value pairs
     */
    function getAllCookies() {
        return document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(Boolean);
    }
    /**
     * Delete a cookie by name, trying all common path/domain combinations
     */
    function deleteCookie(name) {
        const hostname = window.location.hostname;
        const paths = ['/', window.location.pathname];
        // Build domain variants: current domain + parent domains
        const domains = ['', hostname];
        const parts = hostname.split('.');
        if (parts.length > 2) {
            // Add parent domain (e.g., .example.com for sub.example.com)
            domains.push('.' + parts.slice(-2).join('.'));
        }
        domains.push('.' + hostname);
        for (const domain of domains) {
            for (const path of paths) {
                const domainPart = domain ? `; domain=${domain}` : '';
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}; secure`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}; samesite=lax`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}; samesite=none; secure`;
            }
        }
    }
    /**
     * Clear cookies matching patterns for denied categories
     */
    function clearCookiesForCategory(category) {
        const patterns = CATEGORY_PATTERNS[category];
        if (!patterns)
            return;
        const cookies = getAllCookies();
        for (const name of cookies) {
            if (patterns.some(pattern => pattern.test(name))) {
                deleteCookie(name);
            }
        }
    }
    /**
     * Clear all non-essential cookies based on consent categories
     */
    function clearDeniedCookies(categories) {
        for (const [category, allowed] of Object.entries(categories)) {
            if (!allowed && category !== 'necessary') {
                clearCookiesForCategory(category);
            }
        }
    }

    /**
     * CookieConsent - Main orchestrator class
     */
    class CookieConsent {
        constructor(config) {
            this.banner = null;
            this.preferenceCenter = null;
            this.floatingWidget = null;
            this.gtmIntegration = null;
            this.config = this.validateConfig(config);
            this.consentManager = new ConsentManager(this.config);
            this.storageManager = new StorageManager();
            this.eventEmitter = new EventEmitter();
            this.scriptBlocker = new ScriptBlocker(new CategoryManager(), this.eventEmitter);
            if (this.config.gtmConsentMode) {
                this.gtmIntegration = new GTMConsentMode(new DataLayerManager(), this.config);
            }
            // Listen for preference center requests
            this.eventEmitter.on('preferences:show', () => {
                this.showPreferences();
            });
            // Listen for consent updates
            this.eventEmitter.on('consent:accept', (categories) => {
                this.updateConsent(categories);
            });
            this.eventEmitter.on('consent:reject', (categories) => {
                this.updateConsent(categories);
            });
            this.eventEmitter.on('consent:update', (categories) => {
                this.updateConsent(categories);
            });
        }
        /**
         * Initialize the cookie consent system
         */
        init() {
            // 1. Start blocking scripts immediately
            this.scriptBlocker.init();
            // 2. Set GTM default consent BEFORE checking storage
            if (this.gtmIntegration) {
                this.gtmIntegration.setDefaultConsent();
            }
            // 3. Check for existing consent
            const storedConsent = this.storageManager.load();
            if (storedConsent && !this.storageManager.isExpired(storedConsent)) {
                // Valid consent exists
                if (this.consentManager.needsUpdate(storedConsent)) {
                    // Policy updated, show banner again
                    if (this.config.autoShow) {
                        this.showBanner();
                    }
                }
                else {
                    // Apply stored consent
                    this.applyConsent(storedConsent.categories);
                    // Restore GTM consent for returning visitors (within wait_for_update window)
                    if (this.gtmIntegration) {
                        this.gtmIntegration.updateConsent(storedConsent.categories);
                    }
                    this.eventEmitter.emit('consent:load', storedConsent);
                    // Show floating widget if enabled
                    if (this.config.showWidget) {
                        this.showFloatingWidget();
                    }
                }
            }
            else {
                // No consent or expired
                if (this.config.autoShow) {
                    this.showBanner();
                }
            }
            // Store instance globally so it won't be garbage collected
            // when used without a variable (e.g. new CookieConsent({}).init())
            window.cookieConsent = this;
            this.eventEmitter.emit('consent:init');
        }
        /**
         * Show the banner
         */
        show() {
            this.showBanner();
        }
        /**
         * Hide the banner
         */
        hide() {
            var _a;
            (_a = this.banner) === null || _a === void 0 ? void 0 : _a.hide();
        }
        /**
         * Show preferences modal
         */
        showPreferences() {
            var _a;
            const stored = (_a = this.storageManager.load()) === null || _a === void 0 ? void 0 : _a.categories;
            // Default to all ON when no prior consent (user chose to customize)
            const currentConsent = stored || {
                necessary: true,
                analytics: true,
                marketing: true,
                preferences: true,
            };
            // Always recreate to get fresh state from storage
            if (this.preferenceCenter) {
                this.preferenceCenter.destroy();
            }
            this.preferenceCenter = new PreferenceCenter(this.config, this.eventEmitter, currentConsent);
            this.preferenceCenter.show();
        }
        /**
         * Update consent with new categories
         */
        updateConsent(categories) {
            const consentRecord = this.consentManager.updateConsent(categories);
            this.storageManager.save(consentRecord);
            this.applyConsent(categories);
            if (this.gtmIntegration) {
                this.gtmIntegration.updateConsent(categories);
            }
            // Show floating widget after consent is given (delay to let banner hide)
            if (this.config.showWidget) {
                setTimeout(() => {
                    this.showFloatingWidget();
                }, 400); // Wait for banner hide animation
            }
        }
        /**
         * Get current consent
         */
        getConsent() {
            return this.storageManager.load();
        }
        /**
         * Reset consent (clear stored data and show banner)
         */
        reset() {
            this.storageManager.clear();
            this.scriptBlocker.block();
            // Clear all non-essential cookies on reset
            clearDeniedCookies({ necessary: true, analytics: false, marketing: false, preferences: false });
            // Update GTM to denied state
            if (this.gtmIntegration) {
                this.gtmIntegration.updateConsent({ necessary: true, analytics: false, marketing: false });
            }
            this.showBanner();
        }
        /**
         * Register event handler
         */
        on(event, callback) {
            this.eventEmitter.on(event, callback);
        }
        /**
         * Unregister event handler
         */
        off(event, callback) {
            this.eventEmitter.off(event, callback);
        }
        /**
         * Destroy and cleanup all UI elements
         */
        destroy() {
            var _a, _b, _c, _d;
            (_a = this.banner) === null || _a === void 0 ? void 0 : _a.destroy();
            this.banner = null;
            (_b = this.preferenceCenter) === null || _b === void 0 ? void 0 : _b.destroy();
            this.preferenceCenter = null;
            (_c = this.floatingWidget) === null || _c === void 0 ? void 0 : _c.destroy();
            this.floatingWidget = null;
            (_d = this.scriptBlocker) === null || _d === void 0 ? void 0 : _d.destroy();
        }
        /**
         * Show the banner
         */
        showBanner() {
            if (!this.banner) {
                this.banner = new Banner(this.config, this.eventEmitter);
            }
            this.banner.show();
            this.eventEmitter.emit('consent:show');
        }
        /**
         * Show the floating widget
         */
        showFloatingWidget() {
            if (!this.floatingWidget) {
                this.floatingWidget = new FloatingWidget(this.config, this.eventEmitter);
            }
            this.floatingWidget.show();
        }
        /**
         * Apply consent by unblocking allowed scripts and clearing denied cookies
         */
        applyConsent(categories) {
            this.scriptBlocker.unblock(categories);
            // CNIL/GDPR: actively delete cookies for denied categories
            clearDeniedCookies(categories);
        }
        /**
         * Validate and set default config values
         */
        validateConfig(config) {
            return Object.assign(Object.assign({}, config), { mode: config.mode || 'opt-in', autoShow: config.autoShow !== undefined ? config.autoShow : true, revision: config.revision || 1, gtmConsentMode: config.gtmConsentMode !== undefined ? config.gtmConsentMode : true, disablePageInteraction: config.disablePageInteraction || false, theme: config.theme || 'light', position: config.position || 'bottom-left', layout: config.layout || 'box', backdropBlur: config.backdropBlur !== false, animationStyle: config.animationStyle || 'smooth', preferencesPosition: config.preferencesPosition || 'center', showWidget: config.showWidget !== undefined ? config.showWidget : true, widgetPosition: config.widgetPosition || 'bottom-left', widgetStyle: config.widgetStyle || 'compact' });
        }
    }

    exports.CookieConsent = CookieConsent;

}));
//# sourceMappingURL=cookiecraft.js.map
