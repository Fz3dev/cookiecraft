/**
 * Built-in translations for supported languages
 * Users can override any string via config.translations
 */

import { Translation } from '../types';

const en: Translation = {
  title: 'We use cookies',
  description: 'We use cookies to improve your experience on our site. You can choose which cookies you accept.',
  acceptAll: 'Accept all',
  rejectAll: 'Essentials only',
  customize: 'Manage preferences',
  savePreferences: 'Save preferences',
  essentialsOnly: 'Essentials only',
  preferencesTitle: 'Cookie Preferences',
  cookieSettings: 'Cookie settings',
  cookies: 'Cookies',
  privacyPolicyLabel: 'Privacy Policy',
};

const fr: Translation = {
  title: 'Nous utilisons des cookies',
  description: 'Ce site utilise des cookies pour améliorer votre expérience de navigation. Vous pouvez choisir les cookies que vous acceptez.',
  acceptAll: 'Tout accepter',
  rejectAll: 'Essentiels uniquement',
  customize: 'Gérer mes préférences',
  savePreferences: 'Enregistrer',
  essentialsOnly: 'Essentiels uniquement',
  preferencesTitle: 'Préférences des cookies',
  cookieSettings: 'Paramètres des cookies',
  cookies: 'Cookies',
  privacyPolicyLabel: 'Politique de confidentialité',
};

const de: Translation = {
  title: 'Wir verwenden Cookies',
  description: 'Diese Website verwendet Cookies, um Ihr Erlebnis zu verbessern. Sie können wählen, welche Cookies Sie akzeptieren.',
  acceptAll: 'Alle akzeptieren',
  rejectAll: 'Nur essenzielle',
  customize: 'Einstellungen verwalten',
  savePreferences: 'Speichern',
  essentialsOnly: 'Nur essenzielle',
  preferencesTitle: 'Cookie-Einstellungen',
  cookieSettings: 'Cookie-Einstellungen',
  cookies: 'Cookies',
  privacyPolicyLabel: 'Datenschutzrichtlinie',
};

const es: Translation = {
  title: 'Usamos cookies',
  description: 'Este sitio utiliza cookies para mejorar su experiencia. Puede elegir qué cookies acepta.',
  acceptAll: 'Aceptar todo',
  rejectAll: 'Solo esenciales',
  customize: 'Gestionar preferencias',
  savePreferences: 'Guardar',
  essentialsOnly: 'Solo esenciales',
  preferencesTitle: 'Preferencias de cookies',
  cookieSettings: 'Configuración de cookies',
  cookies: 'Cookies',
  privacyPolicyLabel: 'Política de privacidad',
};

const it: Translation = {
  title: 'Utilizziamo i cookie',
  description: 'Questo sito utilizza i cookie per migliorare la tua esperienza. Puoi scegliere quali cookie accettare.',
  acceptAll: 'Accetta tutti',
  rejectAll: 'Solo essenziali',
  customize: 'Gestisci preferenze',
  savePreferences: 'Salva',
  essentialsOnly: 'Solo essenziali',
  preferencesTitle: 'Preferenze cookie',
  cookieSettings: 'Impostazioni cookie',
  cookies: 'Cookie',
  privacyPolicyLabel: 'Informativa sulla privacy',
};

const nl: Translation = {
  title: 'Wij gebruiken cookies',
  description: 'Deze site maakt gebruik van cookies om uw ervaring te verbeteren. U kunt kiezen welke cookies u accepteert.',
  acceptAll: 'Alles accepteren',
  rejectAll: 'Alleen essentieel',
  customize: 'Voorkeuren beheren',
  savePreferences: 'Opslaan',
  essentialsOnly: 'Alleen essentieel',
  preferencesTitle: 'Cookie-voorkeuren',
  cookieSettings: 'Cookie-instellingen',
  cookies: 'Cookies',
  privacyPolicyLabel: 'Privacybeleid',
};

const pt: Translation = {
  title: 'Utilizamos cookies',
  description: 'Este site utiliza cookies para melhorar a sua experiência. Pode escolher quais cookies aceita.',
  acceptAll: 'Aceitar todos',
  rejectAll: 'Apenas essenciais',
  customize: 'Gerir preferências',
  savePreferences: 'Guardar',
  essentialsOnly: 'Apenas essenciais',
  preferencesTitle: 'Preferências de cookies',
  cookieSettings: 'Definições de cookies',
  cookies: 'Cookies',
  privacyPolicyLabel: 'Política de privacidade',
};

export const builtInTranslations: Record<string, Translation> = {
  en,
  fr,
  de,
  es,
  it,
  nl,
  pt,
};
