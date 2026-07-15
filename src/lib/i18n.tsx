import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "de" | "en";

const STORAGE_KEY = "site-scope-locale";

const translations = {
  de: {
    appTitle: "SiteScope",
    appSubtitle: "Tech-Radar",
    beta: "beta",
    docs: "Docs",
    fullscreen: "Vollbild",
    exitFullscreen: "Vollbild beenden",
    language: "Sprache",
    heroTagline: "Live-Analyse · SEO · Security · Tech-Radar",
    heroTitle: "Der Röntgenblick für jede Website",
    heroSubtitle:
      "Gib eine URL ein - WordPress, React-App, klassische Homepage - und sieh den ganzen Stack, alle Signale und Verbindungen.",
    urlPlaceholder: "https://example.com",
    urlLabel: "Website-URL",
    analyze: "Analysieren",
    analyzing: "Analysiere…",
    analyzeError: "Analyse fehlgeschlagen",
    skipToMain: "Zum Hauptinhalt springen",
    tabs: {
      overview: "Übersicht",
      tech: "Tech",
      seo: "SEO",
      security: "Security",
      performance: "Performance",
      compliance: "Recht & BITV",
      compare: "Vergleich",
      business: "Business",
      crawl: "Crawl & Raw",
      wordpress: "WordPress",
    },
    scoreCards: {
      overall: "Overall",
      overallTooltip: "Durchschnitt aus allen Kategorien.",
      seo: "SEO",
      seoTooltip: "Prüft Title, Meta Description, H1, Canonical, OG, Sprache, Bilder-Alt, HTTPS und mehr.",
      security: "Security",
      securityTooltip: "Prüft moderne Sicherheits-Header.",
      performance: "Performance",
      performanceTooltip: "Grober Performance-Score aus TTFB, Payload, Assets, Kompression und Caching.",
      compliance: "Compliance",
      complianceTooltip: "Prüft DSGVO/TDDDG-Signale.",
      accessibility: "Accessibility",
      accessibilityTooltip: "BITV 2.0 / WCAG Heuristiken.",
      mobile: "Mobile",
      mobileTooltip: "Prüft Viewport, Responsive-CSS, Zoom und Touch-Targets.",
      business: "Business",
      businessTooltip: "Prüft typische Business-/UX-Fehler.",
      wordpress: "WordPress",
      wordpressTooltip: "WordPress-spezifische Security- und Performance-Checks.",
    },
    filters: {
      all: "Alle",
      issues: "Probleme",
      ok: "OK",
    },
    comparison: {
      title: "Seiten vergleichen",
      siteA: "Seite A",
      siteB: "Seite B",
      placeholderA: "https://beispiel-a.de",
      placeholderB: "https://beispiel-b.de",
      compare: "Vergleichen",
      result: "Vergleichsergebnis",
      criterion: "Kriterium",
      error: "Vergleich fehlgeschlagen",
      titleLabel: "Titel",
      overallScore: "Gesamt-Score",
      technologies: "Technologien",
      internalLinks: "Interne Links",
      externalLinks: "Externe Links",
      images: "Bilder",
      download: "Download (KB)",
    },
    history: {
      title: "Letzte Analysen",
      empty: "Noch keine Analysen im Browser gespeichert.",
      delete: "Löschen",
    },
    panels: {
      meta: "Meta & Open Graph",
      structure: "Struktur",
      socialPresence: "Social Presence",
      warnings: "Warnungen",
      noSocial: "Keine Social-Media-Links im Quellcode gefunden.",
    },
  },
  en: {
    appTitle: "SiteScope",
    appSubtitle: "Tech-Radar",
    beta: "beta",
    docs: "Docs",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    language: "Language",
    heroTagline: "Live Analysis · SEO · Security · Tech-Radar",
    heroTitle: "The X-ray view for every website",
    heroSubtitle:
      "Enter a URL - WordPress, React app, classic homepage - and see the full stack, signals and connections.",
    urlPlaceholder: "https://example.com",
    urlLabel: "Website URL",
    analyze: "Analyze",
    analyzing: "Analyzing…",
    analyzeError: "Analysis failed",
    skipToMain: "Skip to main content",
    tabs: {
      overview: "Overview",
      tech: "Tech",
      seo: "SEO",
      security: "Security",
      performance: "Performance",
      compliance: "Legal & BITV",
      compare: "Compare",
      business: "Business",
      crawl: "Crawl & Raw",
      wordpress: "WordPress",
    },
    scoreCards: {
      overall: "Overall",
      overallTooltip: "Average across all categories.",
      seo: "SEO",
      seoTooltip: "Checks title, meta description, H1, canonical, OG, language, alt text, HTTPS and more.",
      security: "Security",
      securityTooltip: "Checks modern security headers.",
      performance: "Performance",
      performanceTooltip: "Rough performance score from TTFB, payload, assets, compression and caching.",
      compliance: "Compliance",
      complianceTooltip: "Checks GDPR/ePrivacy signals.",
      accessibility: "Accessibility",
      accessibilityTooltip: "BITV 2.0 / WCAG heuristics.",
      mobile: "Mobile",
      mobileTooltip: "Checks viewport, responsive CSS, zoom and touch targets.",
      business: "Business",
      businessTooltip: "Checks typical business/UX issues.",
      wordpress: "WordPress",
      wordpressTooltip: "WordPress-specific security and performance checks.",
    },
    filters: {
      all: "All",
      issues: "Issues",
      ok: "OK",
    },
    comparison: {
      title: "Compare sites",
      siteA: "Site A",
      siteB: "Site B",
      placeholderA: "https://example-a.com",
      placeholderB: "https://example-b.com",
      compare: "Compare",
      result: "Comparison result",
      criterion: "Criterion",
      error: "Comparison failed",
      titleLabel: "Title",
      overallScore: "Overall Score",
      technologies: "Technologies",
      internalLinks: "Internal Links",
      externalLinks: "External Links",
      images: "Images",
      download: "Download (KB)",
    },
    history: {
      title: "Recent analyses",
      empty: "No analyses saved in this browser yet.",
      delete: "Delete",
    },
    panels: {
      meta: "Meta & Open Graph",
      structure: "Structure",
      socialPresence: "Social Presence",
      warnings: "Warnings",
      noSocial: "No social media links found in source code.",
    },
  },
};

function getTranslation(obj: unknown, key: string): string {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === "string" ? current : key;
}

const I18nContext = createContext<{
  locale: Locale;
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
}>({
  locale: "de",
  t: (key) => getTranslation(translations.de, key),
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === "en" || stored === "de") setLocaleState(stored);
    }
  }, []);

  const setLocale = (locale: Locale) => {
    setLocaleState(locale);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, locale);
    }
  };

  const t = (key: string) => getTranslation(translations[locale], key);

  return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
