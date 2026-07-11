# SiteScope — Der Röntgenblick für jede Website

> Analysiere jede Website in Sekunden: SEO, Security, Performance, Tech-Stack, Verbindungen und mehr — alles in einem übersichtlichen Dashboard.

---

## Features

### Analyse-Kategorien

| Kategorie | Was wird geprüft |
|-----------|-----------------|
| **SEO** | Title, Meta-Description, Canonical, Open Graph, Strukturierte Daten (JSON-LD), Robots-Direktiven |
| **Security** | HTTPS, HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, Mixed Content |
| **Performance** | HTTP/2 & HTTP/3 (Alt-Svc), Kompression (Brotli/Gzip), Cache-Header, Server-Timing |
| **Compliance** | Datenschutz-relevante Skripte, Cookie-Banner, DSGVO-Indikatoren |
| **Mobile** | Viewport-Meta, Touch-Icons, Responsive-Indikatoren |
| **Business** | Kontaktdaten, Schema.org Business-Markup, Social-Media-Präsenz |
| **WordPress** | WP-Erkennung, Plugin- & Theme-Hinweise, WP-Version, REST-API-Exposition |
| **Tech-Stack** | Erkennung von über 50 Technologien: Frameworks, CMS, Analytics, CDN, Webserver, Fonts, Ads, Payment u.v.m. |

### Ergebnis-Dashboard

- **Score-Karten** mit Punktzahl (0–100) und konkreten Verbesserungsvorschlägen pro Kategorie
- **Tech-Stack-Übersicht** mit Icons und Kategorisierung aller erkannten Technologien
- **DNS-Analyse** — A/AAAA/MX/TXT/CNAME/NS Records
- **HTTP-Protokoll-Check** — HTTP-Version, HTTP/2 Direct, HTTP/3 via Alt-Svc
- **Security-Header-Tabelle** — vollständige Übersicht aller relevanten Header
- **Verbindungsgraph** — visuelle Darstellung aller externen Ressourcen & Domains
- **Warnungen & Hinweise** — priorisierte Handlungsempfehlungen

### Export & Berichte

- **PDF-Report** — professioneller Export des kompletten Analyse-Ergebnisses
- **Report-Verlauf** — lokale Speicherung vergangener Analysen
- **Report-Vergleich** — zwei Reports nebeneinander vergleichen

---

## Tech-Stack

| Schicht | Technologie |
|---------|------------|
| **Frontend** | React 19 + TypeScript |
| **Routing & SSR** | TanStack Start (TanStack Router + Nitro) |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Daten** | TanStack Query |
| **Visualisierung** | D3 Force Graph (Verbindungsgraph), Canvas API (Hintergrundanimation) |
| **Server-Analyse** | Node.js `https`, `http2`, `dns/promises` |
| **Build** | Vite + Cloudflare (Nitro-Target) |

---

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build
npm run build

# Build vorschauen
npm run preview
```

Der Dev-Server läuft standardmäßig auf **http://localhost:3000**.

---

## Projektstruktur

```
src/
├── routes/
│   ├── __root.tsx          # App-Shell, Meta-Tags, Error-Boundary
│   └── index.tsx           # Haupt-UI: Hero, Analyse-Form, Dashboard, Hintergrundanimation
├── lib/
│   ├── analyze.functions.ts # Kernlogik: alle Server-seitigen Analyse-Funktionen
│   ├── ranking.functions.ts # Keyword-Ranking-Checks
│   ├── reportStorage.ts     # Lokale Report-Speicherung
│   └── error-reporting.ts   # Error-Boundary-Handler
├── components/
│   ├── ConnectionsGraph.tsx  # D3 Verbindungsgraph
│   ├── ReportPDF.tsx         # PDF-Export-Komponente
│   ├── ReportCompare.tsx     # Report-Vergleichs-Ansicht
│   └── KeywordRankChecker.tsx# Keyword-Rank-Checker
└── styles.css               # Globale Stile & Design-Token
```

---

## Analyse-Ablauf

```
URL-Eingabe
    │
    ▼
Server Function (TanStack Start)
    ├── fetch() → HTML parsen (DOMParser / Regex)
    ├── DNS-Lookup (dns/promises)
    ├── HTTP-Protokoll-Check (https + http2)
    ├── Security-Header-Prüfung
    ├── Tech-Stack-Fingerprinting
    ├── SEO / Meta / Structured Data
    └── Score-Berechnung (0–100 je Kategorie)
    │
    ▼
React-Dashboard (Client)
    ├── Score-Karten
    ├── Tech-Stack-Grid
    ├── Verbindungsgraph (D3)
    └── Export (PDF / Verlauf / Vergleich)
```

---

## Lizenz

MIT — freie Verwendung, Modifikation und Weitergabe.

---

<div align="center">
  <strong>SiteScope</strong> · Gebaut mit React + TypeScript + Tailwind CSS
</div>
