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
    footer: {
      description:
        "SiteScope analysiert Websites in Sekunden. Von SEO und Performance über Security und Compliance bis hin zu Mobile, Business-Checks und WordPress - alles in einem übersichtlichen Dashboard.",
      madeWith: "Für bessere Websites.",
      showMore: "Mehr anzeigen",
      showLess: "Weniger anzeigen",
      links: "Nützliche Links",
    },
    results: {
      title: "Analyseergebnis",
      reportDownload: "PDF herunterladen",
      generatingPdf: "Generiere PDF…",
      compareReport: "Vergleichen",
      noResults: "Noch kein Ergebnis. Starte eine Analyse.",
    },
    reportCompare: {
      title: "Berichtsvergleich",
      hint: "Wähle einen früheren Export aus, um Fortschritte oder Rückschritte zu sehen.",
      empty: "Noch keine gespeicherten Berichte. Exportiere zuerst ein PDF.",
      select: "Früheren Bericht wählen",
      category: "Kategorie",
      before: "Vorher",
      now: "Jetzt",
      fixed: "Behoben",
      newProblems: "Neu hinzugekommen",
      noChanges: "Keine Änderungen an den Problemstellen festgestellt.",
    },
    cookieBanner: {
      label: "Cookies",
      detected: "Banner aktiv",
      missing: "Banner fehlt",
      notNeeded: "keiner nötig",
      assessment: "Einschätzung",
      servicesLabel: "Dienste",
    },
    cookieConsent: {
      title: "Cookie-Consent Zusammenfassung",
      consentTool: "Consent-Tool",
      bannerDetected: "Banner erkannt",
      nonEssentialCookies: "Nicht-notwendige Cookies",
      trackingServices: "Tracking- & Marketing-Dienste",
      detected: "erkannt",
    },
    wordpress: {
      restApiActive: "aktiv",
      restApiBlocked: "blockiert",
      usersListable: "Benutzer auflistbar",
      tabChecks: "WordPress-Check",
      tabApi: "API / Headless",
      apiCheckTitle: "API / Headless Check",
      apiCheckDescription: "Gib einen JWT/Bearer- oder Application-Password-Token ein, um geschützte WordPress REST- und GraphQL-Endpunkte zu testen. Der Token wird nicht gespeichert.",
      apiTokenLabel: "Token (JWT / Bearer / Basic)",
      apiTokenPlaceholder: "Bearer eyJhbGciOiJIUzI1NiIs...",
      apiCheckButton: "API prüfen",
      apiRestAvailable: "REST API erreichbar",
      apiGraphQlAvailable: "GraphQL erreichbar",
      apiUsersListable: "Benutzer auflistbar",
      apiEndpoint: "Endpoint",
      apiStatus: "Status",
      apiItems: "Einträge",
      apiAccessible: "Erreichbar",
      apiBlocked: "Blockiert",
      apiWithToken: "Token",
      apiAnonymous: "anonym",
      apiPlugins: "Erkannte API-Plugins",
      apiGraphQlTypes: "GraphQL Typen",
      apiNoTokenHint: "Klicke auf \"API prüfen\", um die öffentlichen Endpoints zu testen. Gib Token, Username/Passwort oder ein Application Password ein, um auch geschützte Endpoints zu prüfen.",
      apiShowDetails: "Details anzeigen",
      apiHideDetails: "Details ausblenden",
      apiResponseBody: "API-Antwort",
      apiViewJson: "JSON",
      apiViewTable: "Tabelle",
      apiUsernameLabel: "WordPress Username",
      apiPasswordLabel: "WordPress Passwort",
      apiApplicationPasswordLabel: "Application Password (user:password)",
      apiNotChecked: "Noch nicht geprüft. Gib Zugangsdaten ein und klicke auf \"API prüfen\".",
    },
    tech: {
      graphDescription: "So hängt der Stack zusammen. Ziehen, zoomen, entdecken.",
      stackTitle: "Tech-Stack",
      noTech: "Keine bekannten Technologien erkannt.",
      languages: "Sprachen",
      graphTitle: "Verbindungen",
      architectureTitle: "Architektur",
      pwaTitle: "Progressive Web App (PWA)",
      pwaServiceWorker: "Service Worker",
      pwaManifest: "Manifest erreichbar",
      pwaDisplayMode: "Display-Modus",
      pwaStartUrl: "Start URL",
      pwaManifestUrl: "Manifest",
      pwaThemeColor: "Theme-Farbe",
      pwaYes: "ja",
      pwaNo: "nein",
    },
    security: {
      headerTitle: "Security Header",
      headerDescription:
        "Header werden fast immer auf dem Server oder CDN gesetzt. Klick ein rotes X an, um zu sehen, wo und wie du den Header einstellst.",
      mixedContentTitle: "Mixed Content",
      mixedContentEmpty: "Keine HTTP-Ressourcen auf HTTPS-Seite gefunden.",
      mixedContentWarning:
        "Diese Ressourcen werden über HTTP eingebunden und erzeugen in modernen Browsern Sicherheitswarnungen.",
      cookiesTitle: "Cookies",
      noCookies: "Keine Cookies bei der Initial-Response.",
      restApiTooltip:
        "Die REST API ist bei Headless-WordPress oder Gutenberg meist beabsichtigt aktiv. Nur \"Benutzer auflistbar\" ist kritisch, weil Angreifer damit Benutzernamen sammeln können.",
    },
    performance: {
      signalsTitle: "Performance-Signale",
      signalsDescription:
        "Rot bedeutet: hier lässt sich Geschwindigkeit holen. Jeder Punkt zeigt, wo du ansetzt und wo die Einstellung sitzt.",
      mobileTitle: "Mobile-Optimierung",
      mobileDescription:
        "Heuristische Prüfung auf Mobil-Tauglichkeit: Viewport, Responsive-CSS, Zoom, Touch-Target-Größen und bekannte responsive Frameworks. Kein Ersatz für echte Geräte-Tests.",
      ready: "bereit",
      check: "prüfen",
      preview: "Vorschau",
      coreWebVitals: "Core Web Vitals",
      noPageSpeedData: "Keine PageSpeed-Daten verfügbar.",
      estimatedValues:
        "Geschätzte Werte. Für echte Lighthouse-Messungen hinterlege einen PAGESPEED_API_KEY.",
      metricGood: "gut",
      metricNeedsImprovement: "verbesserungswürdig",
      metricPoor: "schlecht",
    },
    compliance: {
      dsgvoTitle: "DSGVO / TDDDG Checks",
      dsgvoDescription:
        "Diese Checks ersetzen keine Rechtsberatung, zeigen aber die wichtigsten Hebel für deutsche Datenschutz-Anforderungen.",
      bitvTitle: "BITV 2.0 / Barrierefreiheit",
      bitvDescription:
        "Heuristische Prüfung aus dem HTML. Kein Ersatz für einen vollständigen BITV/WCAG-Test mit assistiven Technologien.",
    },
    business: {
      title: "Business- & UX-Checks",
      description:
        "Heuristische Prüfung typischer Business-/UX-Fehler aus dem HTML und Inline-CSS: klickbare Kontakte, Layout-Überlappungen, lesbare Schrift, Pop-ups, mobiles Menü, Cookie-Banner und absendbare Formulare. Kein Ersatz für echte UX-Tests.",
    },
    wordpressChecks: {
      title: "WordPress-Checks",
      description:
        "WordPress-spezifische Sicherheits- und Performance-Checks aus dem HTML und schnellen Endpunkt-Tests. Kein Ersatz für ein vollständiges WordPress-Audit.",
    },
    seo: {
      tabs: {
        checks: "SEO-Checks",
        keywords: "Keywords",
        images: "Bilder",
        structure: "Struktur",
      },
      checksTitle: "SEO Checks",
      checksHint:
        "Tippe einen Check an, der rot ist - du siehst dann, wo du die Einstellung findest und wie du ihn behebst.",
      keywordTitle: "Keyword-Ranking-Check",
      imagesTitle: "Bilder",
      noImages: "Keine Bilder im HTML gefunden.",
      noSrc: "kein src",
      noAlt: "kein alt",
      altEmpty: "Alt: leer",
      headingsTitle: "Heading-Hierarchie",
      noHeadings: "Keine Headings gefunden.",
      noSchema: "Kein JSON-LD / Schema.org Markup gefunden.",
    },
    raw: {
      responseHeaders: "Response Headers",
      robotsTxt: "robots.txt",
      sitemap: "sitemap.xml",
      sitemapUrls: "{count} URLs",
      noSitemap: "Keine Sitemap gefunden.",
      externalApis: "Externe APIs / Dienste",
      hostingDetails: "Hosting-Details",
      backendHosting: "Backend & Hosting",
      blocksAll: "Blockt alles",
      crawlingAllowed: "Crawling erlaubt",
      sitemapRefs: "Sitemap-Verweise",
      noRobots: "Keine robots.txt gefunden.",
      urlsInIndex: "URLs im Index",
    },
    links: {
      title: "Links",
      internal: "Interne Links",
      external: "Externe Links",
      nofollow: "Nofollow",
      topDomains: "Top Domains",
      trackedLinks: "verfolgbare Links",
    },
    scoreCard: {
      perfect: "perfekt",
      improvementSingular: "Verbesserung",
      improvementsPlural: "Verbesserungen",
    },
    howToFix: {
      title: "So behebst du das",
      location: "Ort",
      learnMore: "Mehr dazu",
    },
    cookieCategory: {
      necessary: "notwendig",
      analytics: "analyse",
      marketing: "marketing",
      unknown: "unbekannt",
    },
    common: {
      yes: "Ja",
      no: "Nein",
      none: "-",
      notFound: "Nicht gefunden",
      close: "Schließen",
      open: "Öffnen",
      unknown: "unbekannt",
      loading: "lädt…",
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
    footer: {
      description:
        "SiteScope analyzes websites in seconds. From SEO and performance to security and compliance, plus mobile, business checks and WordPress - all in one clear dashboard.",
      madeWith: "For better websites.",
      showMore: "Show more",
      showLess: "Show less",
      links: "Useful links",
    },
    results: {
      title: "Analysis result",
      reportDownload: "Download PDF",
      generatingPdf: "Generating PDF…",
      compareReport: "Compare",
      noResults: "No result yet. Start an analysis.",
    },
    reportCompare: {
      title: "Report comparison",
      hint: "Select an earlier export to see improvements or regressions.",
      empty: "No saved reports yet. Export a PDF first.",
      select: "Select an earlier report",
      category: "Category",
      before: "Before",
      now: "Now",
      fixed: "Fixed",
      newProblems: "New issues",
      noChanges: "No changes detected in problem areas.",
    },
    cookieBanner: {
      label: "Cookies",
      detected: "Banner active",
      missing: "Banner missing",
      notNeeded: "not needed",
      assessment: "Assessment",
      servicesLabel: "Services",
    },
    cookieConsent: {
      title: "Cookie Consent Summary",
      consentTool: "Consent Tool",
      bannerDetected: "Banner detected",
      nonEssentialCookies: "Non-essential cookies",
      trackingServices: "Tracking & Marketing Services",
      detected: "detected",
    },
    wordpress: {
      restApiActive: "active",
      restApiBlocked: "blocked",
      usersListable: "users listable",
      tabChecks: "WordPress Check",
      tabApi: "API / Headless",
      apiCheckTitle: "API / Headless Check",
      apiCheckDescription:
        "Enter a JWT/Bearer or Application Password token to test protected WordPress REST and GraphQL endpoints. The token is never stored.",
      apiTokenLabel: "Token (JWT / Bearer / Basic)",
      apiTokenPlaceholder: "Bearer eyJhbGciOiJIUzI1NiIs...",
      apiCheckButton: "Check API",
      apiRestAvailable: "REST API reachable",
      apiGraphQlAvailable: "GraphQL reachable",
      apiUsersListable: "Users listable",
      apiEndpoint: "Endpoint",
      apiStatus: "Status",
      apiItems: "Items",
      apiAccessible: "Accessible",
      apiBlocked: "Blocked",
      apiWithToken: "token",
      apiAnonymous: "anonymous",
      apiPlugins: "Detected API plugins",
      apiGraphQlTypes: "GraphQL types",
      apiNoTokenHint: "Click \"Check API\" to test public endpoints. Enter a token, username/password or an application password to also test protected endpoints.",
      apiShowDetails: "Show details",
      apiHideDetails: "Hide details",
      apiResponseBody: "API response",
      apiViewJson: "JSON",
      apiViewTable: "Table",
      apiUsernameLabel: "WordPress username",
      apiPasswordLabel: "WordPress password",
      apiApplicationPasswordLabel: "Application password (user:password)",
      apiNotChecked: "Not checked yet. Enter credentials and click \"Check API\".",
    },
    tech: {
      graphDescription: "This is how the stack connects. Drag, zoom, explore.",
      stackTitle: "Tech Stack",
      noTech: "No known technologies detected.",
      languages: "Languages",
      graphTitle: "Connections",
      architectureTitle: "Architecture",
      pwaTitle: "Progressive Web App (PWA)",
      pwaServiceWorker: "Service Worker",
      pwaManifest: "Manifest reachable",
      pwaDisplayMode: "Display mode",
      pwaStartUrl: "Start URL",
      pwaManifestUrl: "Manifest",
      pwaThemeColor: "Theme color",
      pwaYes: "yes",
      pwaNo: "no",
    },
    security: {
      headerTitle: "Security Headers",
      headerDescription:
        "Headers are usually set on the server or CDN. Click a red X to see where and how to configure it.",
      mixedContentTitle: "Mixed Content",
      mixedContentEmpty: "No HTTP resources found on HTTPS page.",
      mixedContentWarning:
        "These resources are loaded over HTTP and trigger security warnings in modern browsers.",
      cookiesTitle: "Cookies",
      noCookies: "No cookies in the initial response.",
      restApiTooltip:
        "The REST API is usually intentionally active for Headless WordPress or Gutenberg. Only \"users listable\" is critical, because attackers can collect usernames.",
    },
    performance: {
      signalsTitle: "Performance Signals",
      signalsDescription:
        "Red means: speed can be gained here. Each item shows where to start and where the setting lives.",
      mobileTitle: "Mobile Optimization",
      mobileDescription:
        "Heuristic mobile-friendliness check: viewport, responsive CSS, zoom, touch target sizes and known responsive frameworks. No substitute for real device tests.",
      ready: "ready",
      check: "check",
      preview: "Preview",
      coreWebVitals: "Core Web Vitals",
      noPageSpeedData: "No PageSpeed data available.",
      estimatedValues:
        "Estimated values. Add a PAGESPEED_API_KEY for real Lighthouse measurements.",
      metricGood: "good",
      metricNeedsImprovement: "needs improvement",
      metricPoor: "poor",
    },
    compliance: {
      dsgvoTitle: "GDPR / ePrivacy Checks",
      dsgvoDescription:
        "These checks do not replace legal advice, but show the most important levers for German privacy requirements.",
      bitvTitle: "BITV 2.0 / Accessibility",
      bitvDescription:
        "Heuristic check based on HTML. Not a substitute for a full BITV/WCAG test with assistive technologies.",
    },
    business: {
      title: "Business & UX Checks",
      description:
        "Heuristic check for typical business/UX issues from HTML and inline CSS: clickable contacts, layout overlaps, readable fonts, pop-ups, mobile menu, cookie banner and submittable forms. Not a substitute for real UX tests.",
    },
    wordpressChecks: {
      title: "WordPress Checks",
      description:
        "WordPress-specific security and performance checks from HTML and quick endpoint tests. Not a substitute for a full WordPress audit.",
    },
    seo: {
      tabs: {
        checks: "SEO Checks",
        keywords: "Keywords",
        images: "Images",
        structure: "Structure",
      },
      checksTitle: "SEO Checks",
      checksHint:
        "Tap a red check to see where the setting lives and how to fix it.",
      keywordTitle: "Keyword Ranking Check",
      imagesTitle: "Images",
      noImages: "No images found in HTML.",
      noSrc: "no src",
      noAlt: "no alt",
      altEmpty: "Alt: empty",
      headingsTitle: "Heading Hierarchy",
      noHeadings: "No headings found.",
      noSchema: "No JSON-LD / Schema.org markup found.",
    },
    raw: {
      responseHeaders: "Response Headers",
      robotsTxt: "robots.txt",
      sitemap: "sitemap.xml",
      sitemapUrls: "{count} URLs",
      noSitemap: "No sitemap found.",
      externalApis: "External APIs / Services",
      hostingDetails: "Hosting Details",
      backendHosting: "Backend & Hosting",
      blocksAll: "Blocks all",
      crawlingAllowed: "Crawling allowed",
      sitemapRefs: "sitemap refs",
      noRobots: "No robots.txt found.",
      urlsInIndex: "URLs in index",
    },
    links: {
      title: "Links",
      internal: "Internal Links",
      external: "External Links",
      nofollow: "Nofollow",
      topDomains: "Top Domains",
      trackedLinks: "tracked links",
    },
    scoreCard: {
      perfect: "perfect",
      improvementSingular: "improvement",
      improvementsPlural: "improvements",
    },
    howToFix: {
      title: "How to fix",
      location: "Location",
      learnMore: "Learn more",
    },
    cookieCategory: {
      necessary: "necessary",
      analytics: "analytics",
      marketing: "marketing",
      unknown: "unknown",
    },
    common: {
      yes: "Yes",
      no: "No",
      none: "-",
      notFound: "Not found",
      close: "Close",
      open: "Open",
      unknown: "unknown",
      loading: "loading…",
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
