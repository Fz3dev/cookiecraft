# CookieCraft

[![npm version](https://img.shields.io/npm/v/cookiecraft.svg)](https://www.npmjs.com/package/cookiecraft)
[![bundle size](https://img.shields.io/bundlephobia/minzip/cookiecraft)](https://bundlephobia.com/package/cookiecraft)
[![license](https://img.shields.io/npm/l/cookiecraft.svg)](https://github.com/Fz3dev/cookiecraft/blob/main/LICENSE)

**Lightweight GDPR-compliant cookie consent library for any website.**

Zero dependencies. Modern UI. Google Consent Mode v2 built-in. Works on Webflow, WordPress, Shopify, or any site.

[Live Configurator](https://fz3dev.github.io/cookiecraft/settings.html) | [Demo](https://fz3dev.github.io/cookiecraft/)

## Features

- **GDPR Compliant** — Opt-in only, one-click "Reject all", cookie purge on rejection, 6-month consent expiry (CNIL)
- **Lightweight** — < 15KB total (JS + CSS), zero runtime dependencies
- **Modern UI** — Clean design, dark/light/auto themes, smooth animations
- **GTM Ready** — Google Consent Mode v2 built-in (ad_storage, analytics_storage, etc.)
- **Accessible** — WCAG 2.2 AA, focus trapping, keyboard navigation, ARIA attributes
- **Customizable** — Primary color, layouts, positions, translations, CSS variables
- **Universal** — Works on any website via CDN (Webflow, WordPress, Shopify, custom)
- **Script Blocking** — Tag scripts with `type="text/plain"` + `data-cookieconsent` and they only run after consent
- **Floating Widget** — Persistent button for users to update preferences anytime
- **Visual Configurator** — No-code setup tool that generates ready-to-paste code

## Quick Start

Add this before `</body>` on your site:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/cookiecraft@1/dist/cookiecraft.css"
/>
<script src="https://cdn.jsdelivr.net/npm/cookiecraft@1/dist/cookiecraft.min.js"></script>

<script>
  new CookieCraft.CookieConsent({
    primaryColor: "#0066cc",
    categories: {
      necessary: {
        enabled: true,
        readOnly: true,
        label: "Essential",
        description: "Required for the website to function.",
      },
      analytics: {
        enabled: true,
        readOnly: false,
        label: "Analytics",
        description: "Help us understand how you use our site.",
      },
      marketing: {
        enabled: true,
        readOnly: false,
        label: "Marketing",
        description: "Used to deliver relevant ads.",
      },
    },
    translations: {
      title: "Your privacy matters",
      description:
        "We use cookies to improve your experience. You choose which ones you accept.",
    },
  }).init();
</script>
```

Or use the **[Visual Configurator](https://fz3dev.github.io/cookiecraft/settings.html)** to generate your code without writing anything.

### Platform-specific instructions

**Webflow** — Paste in Site Settings > Custom Code > Footer Code.

**WordPress** — Paste in your theme's `footer.php` before `</body>`, or use a "Insert Headers and Footers" plugin.

**Shopify** — Paste in Online Store > Themes > Edit Code > `theme.liquid` before `</body>`.

## Script Blocking

Change tracking scripts to `type="text/plain"` with a `data-cookieconsent` attribute. CookieCraft blocks them until the user consents:

```html
<!-- Google Analytics — blocked until analytics consent -->
<script
  type="text/plain"
  data-cookieconsent="analytics"
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"
></script>

<!-- Facebook Pixel — blocked until marketing consent -->
<script type="text/plain" data-cookieconsent="marketing">
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

## Layout Options

### Banner Layouts

| Layout     | Description                        |
| ---------- | ---------------------------------- |
| `bar`      | Full-width banner at top or bottom |
| `box`      | Compact modal in corner or center  |
| `floating` | Small notification-style banner    |

### Positions

`bottom` (default), `top`, `center`, `bottom-left`, `bottom-right`

### Floating Widget

A permanent button that stays visible after consent, letting users modify preferences:

```javascript
new CookieCraft.CookieConsent({
  showWidget: true, // default: true
  widgetPosition: "bottom-left", // default: 'bottom-left'
  widgetStyle: "compact", // 'compact' or 'full'
});
```

### Examples

```javascript
// Full-width bar at bottom (classic)
new CookieCraft.CookieConsent({ layout: "bar", position: "bottom" }).init();

// Compact box in bottom-right (modern)
new CookieCraft.CookieConsent({
  layout: "box",
  position: "bottom-right",
}).init();

// Centered modal with overlay (maximum attention)
new CookieCraft.CookieConsent({
  layout: "box",
  position: "center",
  disablePageInteraction: true,
}).init();
```

## GTM Consent Mode v2

CookieCraft natively supports Google Consent Mode v2. Just enable it:

```html
<!-- In HEAD, before GTM -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
</script>

<!-- Google Tag Manager -->
<script>
  (function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXX');
</script>

<!-- In FOOTER, with CookieCraft -->
<script>
  new CookieCraft.CookieConsent({
    gtmConsentMode: true,
    // ...
  }).init();
</script>
```

CookieCraft automatically maps categories to GTM signals:

| Category      | GTM Signals                                        |
| ------------- | -------------------------------------------------- |
| `marketing`   | `ad_storage`, `ad_user_data`, `ad_personalization` |
| `analytics`   | `analytics_storage`                                |
| `preferences` | `functionality_storage`, `personalization_storage` |

## Configuration

```typescript
interface ConsentConfig {
  // Core
  autoShow?: boolean; // default: true
  revision?: number; // increment to re-ask consent
  consentExpiryMonths?: number; // default: 6 (CNIL recommendation)

  // Categories
  categories?: Record<
    string,
    {
      enabled: boolean;
      readOnly: boolean;
      label: string;
      description: string;
    }
  >;

  // Appearance
  theme?: "light" | "dark" | "auto"; // default: 'light'
  layout?: "bar" | "box" | "floating"; // default: 'box'
  position?: string; // default: 'bottom-left'
  primaryColor?: string; // hex color
  backdropBlur?: boolean;
  animationStyle?: "smooth" | "minimal";

  // Widget
  showWidget?: boolean; // default: true
  widgetPosition?: string; // default: 'bottom-left'
  widgetStyle?: "compact" | "full"; // default: 'compact'

  // Content
  translations?: Translation;

  // GTM
  gtmConsentMode?: boolean; // default: false

  // Accessibility
  disablePageInteraction?: boolean; // default: false

  // Callbacks
  onAccept?: (categories) => void;
  onChange?: (categories) => void;
  onReject?: () => void;
}
```

## API

```javascript
const cc = new CookieCraft.CookieConsent({
  /* config */
});

cc.init(); // Initialize and show banner if needed
cc.show(); // Show banner manually
cc.hide(); // Hide banner
cc.showPreferences(); // Open preferences modal
cc.getConsent(); // Get current consent record
cc.reset(); // Clear consent and re-show banner
cc.destroy(); // Remove all UI elements

// Events
cc.on("consent:accept", (categories) => {
  /* ... */
});
cc.on("consent:reject", (categories) => {
  /* ... */
});
cc.on("consent:update", (categories) => {
  /* ... */
});
cc.on("preferences:show", () => {
  /* ... */
});
cc.on("script:activated", (script) => {
  /* ... */
});
```

### All Events

| Event              | Payload      | Description                     |
| ------------------ | ------------ | ------------------------------- |
| `consent:init`     | —            | Library initialized             |
| `consent:show`     | —            | Banner shown                    |
| `consent:accept`   | `categories` | User accepted all               |
| `consent:reject`   | `categories` | User rejected non-essential     |
| `consent:update`   | `categories` | Consent changed via preferences |
| `consent:load`     | `record`     | Stored consent loaded           |
| `preferences:show` | —            | Preferences modal opened        |
| `preferences:hide` | —            | Preferences modal closed        |
| `script:activated` | `element`    | Blocked script re-enabled       |

## Styling

Override any style with CSS variables:

```css
:root {
  --cc-primary: #0066cc;
  --cc-bg: #ffffff;
  --cc-text: #1a1a1a;
  --cc-text-secondary: #666666;
  --cc-padding: 1.5rem;
  --cc-gap: 0.75rem;
  --cc-border-radius: 12px;
  --cc-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  --cc-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Browser Support

Chrome, Edge, Firefox, Safari (last 2 versions), iOS Safari, Chrome Android.

## Why CookieCraft?

|                         | CookieCraft | Cookiebot  | OneTrust    |
| ----------------------- | ----------- | ---------- | ----------- |
| **Price**               | Free        | From 12/mo | From 200/mo |
| **Size**                | ~15KB       | ~100KB+    | ~150KB+     |
| **Dependencies**        | 0           | Multiple   | Multiple    |
| **Self-hosted**         | Yes         | No         | No          |
| **GTM Consent Mode v2** | Yes         | Yes        | Yes         |
| **Visual Configurator** | Yes         | Dashboard  | Dashboard   |
| **Open Source**         | MIT         | No         | No          |

## Development

```bash
npm install        # Install dependencies
npm run dev        # Watch mode
npm run build      # Production build
npm test           # Run tests
npm run lint       # Lint
npm run type-check # TypeScript check
npm run size       # Bundle size check
```

## License

MIT
