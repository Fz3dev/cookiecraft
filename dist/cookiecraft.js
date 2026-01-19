(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CookieCraft = {}));
})(this, (function (exports) { 'use strict';

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
            expiryDate.setMonth(expiryDate.getMonth() + 13); // 13 months per GDPR
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
        migrate(oldData) {
            // Handle migration from older versions
            // For v1, no migration needed - just return null
            return null;
        }
    }
    StorageManager.STORAGE_KEY = 'cookiecraft_consent';
    StorageManager.EXPIRY_MONTHS = 13;

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
            this.blockExistingScripts();
        }
        /**
         * Unblock scripts based on consent categories
         */
        unblock(categories) {
            this.currentConsent = categories;
            // Reactivate blocked scripts based on consent
            this.blockedScripts.forEach((script, id) => {
                const category = this.categoryManager.getCategoryForScript(script);
                if (category && this.categoryManager.isAllowed(category, categories)) {
                    this.reactivateScript(script);
                    this.blockedScripts.delete(id);
                }
            });
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
         * Generate unique ID for a script
         */
        generateScriptId(script) {
            return script.src || `inline-${Date.now()}-${Math.random()}`;
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
            var _a;
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
            // Focus first button for accessibility
            const firstButton = (_a = this.element) === null || _a === void 0 ? void 0 : _a.querySelector('button');
            firstButton === null || firstButton === void 0 ? void 0 : firstButton.focus();
            // Disable page interaction if configured
            if (this.config.disablePageInteraction) {
                document.body.style.overflow = 'hidden';
            }
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
            const template = `
      <div
        class="cc-banner cc-banner--${position} cc-banner--${layout} ${backdropBlur ? 'cc-backdrop-blur' : ''}"
        role="region"
        aria-label="Cookie consent"
        aria-live="polite"
        data-theme="${theme}"
        style="${this.config.primaryColor ? `--cc-primary: ${this.config.primaryColor};` : ''}"
      >
        <div class="cc-banner__container">
          <div class="cc-banner__content">
            <h2 class="cc-banner__title">
              ${translations.title || '🍪 Nous utilisons des cookies'}
            </h2>
            <p class="cc-banner__description">
              ${this.getDescriptionHTML()}
            </p>
          </div>
          <div class="cc-banner__actions">
            <button
              class="cc-btn cc-btn--secondary"
              data-action="reject"
              aria-label="Rejeter tous les cookies"
            >
              ${translations.rejectAll || 'Tout rejeter'}
            </button>
            <button
              class="cc-btn cc-btn--tertiary"
              data-action="customize"
              aria-label="Personnaliser les préférences"
            >
              ${translations.customize || 'Personnaliser'}
            </button>
            <button
              class="cc-btn cc-btn--primary"
              data-action="accept"
              aria-label="Accepter tous les cookies"
            >
              ${translations.acceptAll || 'Tout accepter'}
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
                const target = e.target;
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
            const description = translations.description || defaultDescription;
            if (translations.privacyPolicyUrl) {
                const linkLabel = translations.privacyPolicyLabel || 'Politique de confidentialité';
                return `${description} <a href="${translations.privacyPolicyUrl}" target="_blank" rel="noopener noreferrer">${linkLabel}</a>`;
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
            if (!this.element) {
                this.element = this.createDOM();
                document.body.appendChild(this.element);
                this.attachListeners();
            }
            this.element.classList.add('is-visible');
            this.trapFocus();
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
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
            const template = `
      <div
        class="cc-modal cc-modal--${position}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-modal-title"
        data-theme="${theme}"
      >
        <div class="cc-modal__overlay" data-action="close"></div>
        <div class="cc-modal__content">
          <div class="cc-modal__header" style="${this.config.primaryColor ? `--cc-primary: ${this.config.primaryColor}; --cc-primary-hover: ${this.adjustColorBrightness(this.config.primaryColor, -15)};` : ''}">
            <h2 id="cc-modal-title">
              ${translations.preferencesTitle || translations.title || 'Préférences de cookies'}
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
              ${translations.privacyPolicyUrl ? `
                <a href="${translations.privacyPolicyUrl}" target="_blank" rel="noopener noreferrer" class="cc-privacy-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  ${translations.privacyPolicyLabel || 'Politique de confidentialité'}
                </a>
              ` : ''}
            </div>
            <div class="cc-modal__footer-actions">
              <button
                class="cc-btn cc-btn--secondary"
                data-action="reject"
              >
                ${translations.rejectAll || 'Tout rejeter'}
              </button>
              <button
                class="cc-btn cc-btn--primary"
                data-action="save"
              >
                ${translations.savePreferences || 'Sauvegarder'}
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
                data-category="${key}"
                ${checked ? 'checked' : ''}
                ${disabled ? 'disabled' : ''}
                aria-label="${config.label} cookies"
              >
              <span class="cc-toggle__slider"></span>
            </label>
            <div class="cc-category__info">
              <h3>${config.label}</h3>
              <p>${config.description}</p>
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
                const target = e.target;
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
        /**
         * Adjust color brightness for hover effect
         */
        adjustColorBrightness(color, percent) {
            // Remove # if present
            const hex = color.replace('#', '');
            // Convert to RGB
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            // Adjust brightness
            const adjust = (value) => {
                const adjusted = value + (value * percent / 100);
                return Math.max(0, Math.min(255, Math.round(adjusted)));
            };
            // Convert back to hex
            const toHex = (value) => {
                const hex = value.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            };
            return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
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
            console.log('🎯 FloatingWidget.show() called');
            if (!this.element) {
                this.element = this.createDOM();
                document.body.appendChild(this.element);
                this.attachListeners();
                console.log('✅ Widget element created and appended to body');
            }
            // Delay to allow for transition
            requestAnimationFrame(() => {
                var _a;
                (_a = this.element) === null || _a === void 0 ? void 0 : _a.classList.add('is-visible');
                this.isVisible = true;
                console.log('✅ Widget is-visible class added');
            });
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
            const template = `
      <div
        class="cc-widget cc-widget--${widgetPosition}"
        role="button"
        aria-label="${translations.cookieSettings || 'Paramètres des cookies'}"
        tabindex="0"
        data-theme="${theme}"
        style="${this.config.primaryColor ? `--cc-primary: ${this.config.primaryColor};` : ''}"
      >
        <svg class="cc-widget__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="7" cy="7" r="1.5"/>
          <circle cx="17" cy="7" r="1.5"/>
          <circle cx="7" cy="17" r="1.5"/>
          <circle cx="17" cy="17" r="1.5"/>
        </svg>
        <span class="cc-widget__text">
          ${translations.cookies || 'Cookies'}
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
     * GTMConsentMode - Integration with Google Consent Mode v2
     */
    class GTMConsentMode {
        constructor(dataLayerManager) {
            this.dataLayerManager = dataLayerManager;
        }
        /**
         * Set default consent state (MUST be called BEFORE GTM loads)
         */
        setDefaultConsent() {
            this.dataLayerManager.push('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied',
                functionality_storage: 'denied',
                personalization_storage: 'denied',
                security_storage: 'granted', // Always granted
            });
        }
        /**
         * Update consent state based on user choices
         */
        updateConsent(categories) {
            const gtmConsent = this.mapCategoriesToGTM(categories);
            this.dataLayerManager.push('consent', 'update', gtmConsent);
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
     */
    class DataLayerManager {
        /**
         * Push data to GTM dataLayer
         */
        push(command, action, params) {
            // Initialize dataLayer if it doesn't exist
            window.dataLayer = window.dataLayer || [];
            // Push to dataLayer
            window.dataLayer.push({
                event: 'consent_update',
                [command]: {
                    [action]: params,
                },
            });
            // Also push using gtag format if available
            if (typeof window.gtag === 'function') {
                window.gtag(command, action, params);
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
                this.gtmIntegration = new GTMConsentMode(new DataLayerManager());
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
            const currentConsent = ((_a = this.storageManager.load()) === null || _a === void 0 ? void 0 : _a.categories) || {
                necessary: true,
                analytics: false,
                marketing: false,
                preferences: false,
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
                console.log('⏳ Widget will show in 400ms...');
                setTimeout(() => {
                    console.log('🚀 Calling showFloatingWidget()');
                    this.showFloatingWidget();
                }, 400); // Wait for banner hide animation
            }
            else {
                console.log('❌ Widget disabled in config');
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
         * Apply consent by unblocking scripts
         */
        applyConsent(categories) {
            this.scriptBlocker.unblock(categories);
        }
        /**
         * Validate and set default config values
         */
        validateConfig(config) {
            return Object.assign(Object.assign({}, config), { mode: config.mode || 'opt-in', autoShow: config.autoShow !== undefined ? config.autoShow : true, revision: config.revision || 1, gtmConsentMode: config.gtmConsentMode || false, disablePageInteraction: config.disablePageInteraction || false, theme: config.theme || 'light', position: config.position || 'bottom', layout: config.layout || 'bar', backdropBlur: config.backdropBlur !== false, animationStyle: config.animationStyle || 'smooth', preferencesPosition: config.preferencesPosition || 'center', showWidget: config.showWidget !== undefined ? config.showWidget : true, widgetPosition: config.widgetPosition || 'bottom-right' });
        }
    }

    exports.CookieConsent = CookieConsent;
    exports.default = CookieConsent;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=cookiecraft.js.map
