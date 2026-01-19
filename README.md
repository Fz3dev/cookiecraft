# CookieCraft

🍪 **Lightweight GDPR-compliant cookie consent library for any website**

Open-source alternative to Axept.io with modern UI, full RGPD compliance, and Google Consent Mode v2 support. Perfect for Webflow, WordPress, Shopify, or any website.

## Features

- ✅ **GDPR Compliant** - Full opt-in, cookie blocking before consent
- 🎨 **Modern UI** - Beautiful design inspired by Axept.io
- ⚡ **Lightweight** - < 15KB total (JS + CSS minified)
- 🚀 **Zero Dependencies** - Pure Vanilla JavaScript
- 🎯 **Universal** - Works on any website (Webflow, WordPress, Shopify, custom sites)
- 📱 **Responsive** - Mobile-first design
- ♿ **Accessible** - WCAG 2.2 AA compliant
- 🔌 **GTM Ready** - Google Consent Mode v2 built-in
- 🎨 **Customizable** - CSS variables for easy theming
- 🌐 **i18n Ready** - Multi-language support

## Quick Start

### For Webflow

Add this code in **Site Settings > Custom Code > Footer**:

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cookiecraft@1/dist/cookiecraft.min.css">

<!-- JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/cookiecraft@1/dist/cookiecraft.min.js"></script>

<!-- Initialize -->
<script>
  const cookieConsent = new CookieCraft.CookieConsent({
    mode: 'opt-in',
    autoShow: true,
    revision: 1,

    categories: {
      necessary: {
        enabled: true,
        readOnly: true,
        label: 'Essentiels',
        description: 'Nécessaires au bon fonctionnement du site'
      },
      analytics: {
        enabled: false,
        readOnly: false,
        label: 'Statistiques',
        description: 'Pour comprendre comment vous utilisez notre site'
      },
      marketing: {
        enabled: false,
        readOnly: false,
        label: 'Marketing',
        description: 'Pour vous proposer du contenu personnalisé'
      }
    },

    theme: 'auto',
    primaryColor: '#0066cc'
  });

  cookieConsent.init();
</script>
```

### Block Third-Party Scripts

Change your tracking scripts to use `type="text/plain"` and `data-cookieconsent` attribute:

```html
<!-- Google Analytics - Blocked until analytics consent -->
<script type="text/plain" data-cookieconsent="analytics">
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;...})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-XXXXX-Y', 'auto');
  ga('send', 'pageview');
</script>

<!-- Facebook Pixel - Blocked until marketing consent -->
<script type="text/plain" data-cookieconsent="marketing">
  !function(f,b,e,v,n,t,s){...}
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

## Layout Options

Choose from multiple banner styles and positions to match your site's design:

### Banner Layouts

- **`bar`** (default) - Full-width banner at top or bottom
- **`box`** - Compact modal in corner or center
- **`floating`** - Small notification-style banner

### Banner Positions

- **`bottom`** (default) - Bottom of the screen
- **`top`** - Top of the screen
- **`center`** - Centered modal with overlay
- **`bottom-left`** - Bottom left corner
- **`bottom-right`** - Bottom right corner

### Floating Widget

A permanent button that stays visible after consent, allowing users to modify preferences anytime:

- **`showWidget`** (default: `true`) - Show/hide the floating widget
- **`widgetPosition`** (default: `'bottom-right'`) - Widget position: `'bottom-left'`, `'bottom-right'`, `'top-left'`, `'top-right'`

### Examples

```javascript
// Full-width bar at bottom (classic)
const consent = new CookieCraft.CookieConsent({
  layout: 'bar',
  position: 'bottom',
  showWidget: true,
  widgetPosition: 'bottom-right'
});

// Small modal in bottom-right corner (modern)
const consent = new CookieCraft.CookieConsent({
  layout: 'box',
  position: 'bottom-right',
  showWidget: true,
  widgetPosition: 'bottom-left'  // Widget on opposite side
});

// Compact floating notification (minimal)
const consent = new CookieCraft.CookieConsent({
  layout: 'floating',
  position: 'bottom-right',
  showWidget: false  // No widget needed, already compact
});

// Centered modal with overlay (maximum attention)
const consent = new CookieCraft.CookieConsent({
  layout: 'box',
  position: 'center',
  disablePageInteraction: true,  // Block page until choice
  showWidget: true
});
```

## Configuration

### Basic Options

```typescript
interface ConsentConfig {
  // Core settings
  mode: 'opt-in' | 'opt-out';           // GDPR requires 'opt-in'
  autoShow: boolean;                     // Show banner on first visit
  revision: number;                      // Policy version (increment to re-ask)

  // Categories
  categories: {
    necessary: CategoryConfig;
    analytics: CategoryConfig;
    marketing: CategoryConfig;
    preferences?: CategoryConfig;
  };

  // UI customization
  theme?: 'light' | 'dark' | 'auto';
  layout?: 'bar' | 'box' | 'floating';  // Banner layout style
  position?: 'bottom' | 'top' | 'center' | 'bottom-left' | 'bottom-right';
  primaryColor?: string;                 // Hex color
  backdropBlur?: boolean;                // Backdrop blur effect
  animationStyle?: 'smooth' | 'minimal';

  // Floating widget
  showWidget?: boolean;                  // Show permanent settings button
  widgetPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

  // Content
  translations?: Translation;

  // Integration
  gtmConsentMode?: boolean;              // Enable GTM Consent Mode v2

  // Accessibility
  disablePageInteraction?: boolean;      // Block page until consent

  // Callbacks
  onAccept?: (categories) => void;
  onChange?: (categories) => void;
  onReject?: () => void;
}
```

### Category Configuration

```typescript
interface CategoryConfig {
  enabled: boolean;      // Default state
  readOnly: boolean;     // If true, user cannot toggle
  label: string;         // Display name
  description: string;   // Explanation
}
```

### Customization Examples

#### Custom Colors

```javascript
const cookieConsent = new CookieCraft.CookieConsent({
  primaryColor: '#ff6b6b',    // Red theme
  theme: 'dark',
  // ...
});
```

#### Custom Text

```javascript
const cookieConsent = new CookieCraft.CookieConsent({
  translations: {
    title: 'Nous respectons votre vie privée',
    description: 'Choisissez les cookies que vous acceptez',
    acceptAll: 'Tout accepter',
    rejectAll: 'Tout refuser',
    customize: 'Personnaliser',
    savePreferences: 'Enregistrer',
    cookieSettings: 'Paramètres cookies',  // Floating widget tooltip
    cookies: 'Cookies',                    // Floating widget text
  },
  // ...
});
```

#### With GTM Consent Mode v2

```html
<!-- In HEAD, BEFORE GTM -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'analytics_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied'
  });
</script>

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXX');</script>

<!-- In FOOTER -->
<script>
  const cookieConsent = new CookieCraft.CookieConsent({
    gtmConsentMode: true,  // Enable GTM integration
    // ...
  });
  cookieConsent.init();
</script>
```

## API

### Methods

```javascript
// Initialize
cookieConsent.init();

// Show banner
cookieConsent.show();

// Hide banner
cookieConsent.hide();

// Show preferences modal
cookieConsent.showPreferences();

// Get current consent
const consent = cookieConsent.getConsent();
// Returns: { version, timestamp, categories, expiresAt }

// Reset (clear and re-show)
cookieConsent.reset();

// Event listeners
cookieConsent.on('consent:accept', (categories) => {
  console.log('Accepted:', categories);
});

cookieConsent.on('consent:update', (categories) => {
  console.log('Updated:', categories);
});
```

### Events

- `consent:init` - Library initialized
- `consent:show` - Banner shown
- `consent:accept` - All accepted
- `consent:reject` - All rejected
- `consent:update` - Consent changed
- `consent:load` - Stored consent loaded
- `preferences:show` - Preferences modal shown
- `script:activated` - Script unblocked

### Cookie Settings Access

#### Option 1: Floating Widget (Automatic)

The library automatically shows a permanent floating button after consent (enabled by default):

```javascript
const cookieConsent = new CookieCraft.CookieConsent({
  showWidget: true,                    // Show floating widget (default)
  widgetPosition: 'bottom-right',      // Position
  // ...
});
```

#### Option 2: Custom Button (Manual)

In Webflow Designer, add your own button and connect it:

```html
<script>
  document.getElementById('cookie-settings')?.addEventListener('click', () => {
    window.cookieConsent?.showPreferences();
  });
</script>
```

## Styling

### CSS Variables

Customize appearance using CSS variables:

```css
:root {
  /* Colors */
  --cc-primary: #0066cc;
  --cc-bg: #ffffff;
  --cc-text: #1a1a1a;
  --cc-text-secondary: #666666;

  /* Spacing */
  --cc-padding: 1.5rem;
  --cc-gap: 0.75rem;

  /* Borders */
  --cc-border-radius: 12px;
  --cc-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);

  /* Animations */
  --cc-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- iOS Safari (last 2 versions)
- Chrome Android (last 2 versions)

## Development

```bash
# Install dependencies
npm install

# Dev mode with watch
npm run dev

# Build
npm run build

# Run tests
npm test

# Type check
npm run type-check

# Check bundle size
npm run size
```

## Why This Library?

### vs Axept.io

| Feature | Axept.io | CookieCraft |
|---------|----------|-------------|
| **Price** | Freemium → Paid | 100% Free |
| **Code** | Proprietary | Open Source |
| **Hosting** | SaaS only | Self-hosted OK |
| **Size** | ~50KB+ | <15KB |
| **GTM v2** | ✅ Gold partner | ✅ Integrated |
| **Customization** | Dashboard UI | CSS variables |
| **Vendor Lock-in** | Yes | No |

### vs Cookiebot/OneTrust

- **Cost**: Free vs €39+/month
- **Performance**: 10-15KB vs 50-100KB+
- **Privacy**: Self-hosted option vs SaaS only
- **Flexibility**: Full code access vs black box

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © 2026

## Credits

Inspired by:
- [Axept.io](https://www.axept.io) - Premium UX design
- [vanilla-cookieconsent](https://github.com/orestbida/cookieconsent) - Technical patterns

---

Made with ❤️ for the open web
