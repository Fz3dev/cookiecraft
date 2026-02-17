# CookieCraft — Project Rules

## Overview

Lightweight GDPR-compliant cookie consent library. Zero dependencies, vanilla TypeScript, distributed via npm/CDN.

## Tech Stack

TypeScript, Rollup, PostCSS (autoprefixer + cssnano), Jest, size-limit. No runtime dependencies.

## Project Layout

- `src/core/` — Main orchestrator (`CookieConsent`), consent logic, storage, event emitter
- `src/ui/` — UI components: `Banner`, `PreferenceCenter`, `FloatingWidget`
- `src/blocking/` — Script blocking (`ScriptBlocker`, `CategoryManager`)
- `src/integrations/` — GTM Consent Mode v2, dataLayer
- `src/utils/` — Color, cookies, sanitization (XSS prevention)
- `src/styles/` — CSS modules: `banner.css`, `preferences.css`, `widget.css`, `animations.css`
- `src/types/` — TypeScript type definitions
- `docs/` — Landing page (`index.html`) + configurateur (`settings.html`), served via GitHub Pages
- `dist/` — Built outputs (UMD, ESM, minified, CSS, type declarations)

## Entry Point

`src/index.ts` exports `CookieConsent` class + all public types. UMD global: `CookieCraft`.

## Build & Scripts

- `npm run build` — Rollup build (3 formats: UMD, UMD minified, ESM) + size check
- `npm run dev` — Watch mode
- `npm test` — Jest
- `npm run lint` — ESLint
- `npm run type-check` — TypeScript validation
- `npm run size` — Bundle size limit check (JS < 12 KB, CSS < 3 KB)

## Architecture Patterns

- **Event-driven** — Central `EventEmitter` for all component communication. Never call components directly.
- **Sanitize all user input** — Use `escapeHtml()`, `sanitizeUrl()`, `sanitizeColor()` from `src/utils/sanitize.ts` in every HTML template.
- **Optional chaining for config** — Always use `?.` when accessing `config.categories`, `config.translations`, etc. Users may omit any config section.
- **Default values in `validateConfig()`** — All defaults live in `CookieConsent.validateConfig()`. Never assume config fields exist elsewhere.
- **DOM via template strings** — UI components build HTML via template literals, not JSX. Sanitize everything injected.

## CSS

- CSS custom properties for theming: `--cc-primary`, `--cc-primary-hover`, `--cc-bg`, `--cc-text`, etc.
- Dark/light/auto themes via `[data-theme]` attribute.
- All styles scoped under `.cc-` prefix to avoid conflicts.

## Storage

- LocalStorage key: `cookiecraft_consent`
- Consent records include timestamp, categories, userAgent, 13-month expiry.
- `ConsentManager.validateConsent()` skips validation when categories config is empty.

## Distribution

- npm: `cookiecraft`
- CDN: `https://cdn.jsdelivr.net/npm/cookiecraft@1/dist/cookiecraft.min.js`
- After publish, always purge jsdelivr: `https://purge.jsdelivr.net/npm/cookiecraft@1/dist/cookiecraft.min.js`
- The `@1` alias resolves to latest 1.x but has aggressive caching. Use exact version `@1.x.x` for immediate propagation.

## Configurateur (`docs/settings.html`)

- Preview loads library from CDN in production, from `/dist/` locally.
- State object `cfg` holds all configurator values.
- `initPreview()` destroys and recreates the CookieCraft instance.
- `generateCode()` builds the HTML snippet users copy.
- When adding new options: update `cfg` state, add UI bindings, update `initPreview()`, update `generateCode()`.

## Known Gotchas

- jsdelivr CDN purges are throttled (~7 min cooldown). Always purge version resolution (`/npm/cookiecraft@1`) AND the files.
- `EventEmitter.emit()` wraps callbacks in try/catch — errors in handlers are silently caught. Check console carefully.
- `ConsentManager.validateConsent()` rejects consent if category keys don't match config. When categories config is `{}`, validation is skipped.
- PreferenceCenter modal has no close button (GDPR: user must make an explicit choice).

---

## Claude Code Rules

### Commits

- **Never** add "Co-Authored-By: Claude" or any Claude signature in commits.
- Short single-line messages in English.
- Format: `verb object (context)` — e.g. `Fix crash when categories config missing`, `Add widget position option`.

### Pull Requests

- **Never** add "Generated with Claude Code" footer.
- Keep PR descriptions concise: Summary + what changed + how to test.

### Publishing Workflow

1. Bump version in `package.json`
2. `npm run build`
3. `npm test` — vérifier que tous les tests passent
4. `npm publish` (uses `.npmrc` token or automation token)
5. `git add && git commit && git push`
6. Purge jsdelivr CDN (version resolution + JS + CSS files)
7. **Mettre à jour la description du repo GitHub** avec la nouvelle version via `gh repo edit --description "..."`

### Tools

| Need          | Use      | Avoid                          |
| ------------- | -------- | ------------------------------ |
| Read a file   | `Read`   | `cat`, `head`, `tail` via Bash |
| Search code   | `Grep`   | `grep`, `rg` via Bash          |
| Find files    | `Glob`   | `find`, `ls` via Bash          |
| Edit a file   | `Edit`   | `sed`, `awk` via Bash          |
| Create a file | `Write`  | `echo >`, `cat <<EOF` via Bash |

Bash is reserved for: git commands, npm commands, curl (CDN purge), and system commands.

### Security

- Never skip sanitization in HTML templates.
- Never use `innerHTML` with unsanitized user input.
- Never commit `.npmrc` with tokens — create temporarily, delete after publish.
