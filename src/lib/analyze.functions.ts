import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import dns from "node:dns/promises";

export type TechCategory =
  | "javascript-framework"
  | "javascript-library"
  | "ui-framework"
  | "cms"
  | "ecommerce"
  | "analytics"
  | "tag-manager"
  | "cdn"
  | "webserver"
  | "language"
  | "database"
  | "hosting"
  | "font"
  | "ads"
  | "payment"
  | "marketing"
  | "email"
  | "seo"
  | "security"
  | "auth"
  | "error-tracking"
  | "chat"
  | "cdp"
  | "search"
  | "media"
  | "build-tool"
  | "privacy"
  | "accessibility"
  | "misc";

export interface TechHit {
  name: string;
  category: TechCategory;
  confidence: number;
  evidence: string;
  version?: string;
}

export interface SecurityHeader {
  name: string;
  value: string | null;
  ok: boolean;
  advice?: string;
  howToFix?: string;
  location?: string;
  learnMore?: string;
}

export interface SeoCheck {
  key: string;
  label: string;
  ok: boolean;
  value?: string;
  advice?: string;
  howToFix?: string;
  location?: string;
  learnMore?: string;
}

export interface AnalyzeResult {
  url: string;
  finalUrl: string;
  status: number;
  timings: {
    dns: number;
    total: number;
    ttfb: number;
    downloadKb: number;
  };
  score: {
    seo: number;
    security: number;
    performance: number;
    compliance: number;
    overall: number;
  };
  meta: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    lang: string | null;
    favicon: string | null;
    ogImage: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    twitterCard: string | null;
    viewport: string | null;
    charset: string | null;
    generator: string | null;
    themeColor: string | null;
    author: string | null;
    robotsMeta: string | null;
  };
  seoChecks: SeoCheck[];
  perfChecks: SeoCheck[];
  complianceChecks: SeoCheck[];
  headers: Record<string, string>;
  securityHeaders: SecurityHeader[];
  cookies: { name: string; secure: boolean; httpOnly: boolean; sameSite: string | null }[];
  robots: { found: boolean; disallowAll: boolean; sitemaps: string[]; raw?: string };
  sitemap: { found: boolean; urls: number; url?: string };
  tech: TechHit[];
  links: {
    internal: number;
    external: number;
    scripts: number;
    stylesheets: number;
    images: number;
  };
  headings: { h1: number; h2: number; h3: number; h1Text: string[] };
  socials: { platform: string; url: string }[];
  socialHowTo: { platform: string; where: string }[];
  architecture: {
    frontend: string[];
    backend: string[];
    server: string[];
    hosting: string[];
    cms: string[];
    languages: string[];
    apiRoutes: string[];
    summary: string;
  };
  operator: {
    name: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    sourceUrl: string | null;
  };
  hostingDetails: {
    ip: string | null;
    isp: string | null;
    org: string | null;
    country: string | null;
    region: string | null;
    nameservers: string[];
    mx: string[];
    txt: string[];
  };
  externalApis: string[];
  backendHosting: {
    domain: string;
    ip: string | null;
    isp: string | null;
    org: string | null;
    country: string | null;
    region: string | null;
    nameservers: string[];
  }[];
  errors: string[];
  warnings: string[];
}

const InputSchema = z.object({ url: z.string().min(3) });

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

function scoreFromChecks(passed: number, total: number): number {
  if (!total) return 0;
  return Math.round((passed / total) * 100);
}

// Fingerprints — pattern-based detection
type Fingerprint = {
  name: string;
  category: TechCategory;
  html?: RegExp[];
  headers?: Record<string, RegExp>;
  scripts?: RegExp[];
  inlineScripts?: RegExp[];
  cookies?: RegExp[];
  meta?: Record<string, RegExp>;
};

const FINGERPRINTS: Fingerprint[] = [
  // JS Frameworks
  {
    name: "React",
    category: "javascript-framework",
    html: [
      /data-reactroot|__NEXT_DATA__|_reactRoot|react\.production\.min|lucide-react|class="lucide /,
    ],
    scripts: [/react(-dom)?[.@]/i],
    inlineScripts: [/createElement|__REACT_|react-dom|useState|useEffect|lucide-react/],
  },
  { name: "Lucide React", category: "javascript-library", html: [/lucide-react|class="lucide /] },
  { name: "Preact", category: "javascript-framework", scripts: [/preact[.@]/i] },
  {
    name: "Next.js",
    category: "javascript-framework",
    html: [/__NEXT_DATA__|\/_next\//],
    headers: { "x-powered-by": /Next\.js/i },
  },
  {
    name: "Vue.js",
    category: "javascript-framework",
    html: [/data-v-[a-f0-9]{6,}|__VUE__/],
    scripts: [/vue(\.runtime)?[.@]/i],
  },
  { name: "Nuxt", category: "javascript-framework", html: [/__NUXT__|\/_nuxt\//] },
  {
    name: "Angular",
    category: "javascript-framework",
    html: [/ng-version=|ng-app=|_ngcontent-|_nghost-/i],
    scripts: [/angular[.@]|@angular|zone\.js/i],
    inlineScripts: [/ng\.|window\.angular|@angular\/core|zone\.js/i],
  },
  {
    name: "Angular Material",
    category: "ui-framework",
    html: [/\bmat-[a-z]+|mat-typography|cdk-|mat-ripple/],
  },
  { name: "Svelte / SvelteKit", category: "javascript-framework", html: [/svelte-|__sveltekit_/] },
  { name: "Astro", category: "javascript-framework", html: [/astro-island|data-astro-/] },
  { name: "Gatsby", category: "javascript-framework", html: [/___gatsby|gatsby-focus-wrapper/] },
  { name: "Remix", category: "javascript-framework", html: [/__remixContext/] },
  { name: "SolidJS", category: "javascript-framework", scripts: [/solid-js/i] },
  { name: "Qwik", category: "javascript-framework", html: [/q:container|qwik/i] },
  { name: "Ember.js", category: "javascript-framework", html: [/ember-application|data-ember-/] },
  { name: "Backbone.js", category: "javascript-framework", scripts: [/backbone[.@]/i] },
  {
    name: "TanStack Start",
    category: "javascript-framework",
    html: [/\$_TSR|\$tsr|tsr-scroll-restoration|@tanstack\/(start|react-start|react-router)/],
  },
  {
    name: "Vite",
    category: "build-tool",
    html: [/\/@vite\/client|__vite__|\/assets\/[a-zA-Z0-9_-]+-[a-f0-9]{6,}\.(js|css)/],
  },
  { name: "Webpack", category: "build-tool", html: [/webpackChunk|__webpack_require__/] },
  { name: "Turbopack", category: "build-tool", html: [/turbopack/] },

  // JS Libraries
  { name: "jQuery", category: "javascript-library", scripts: [/jquery[-.]?(\d|min|slim)/i] },
  { name: "Lodash", category: "javascript-library", scripts: [/lodash(\.min)?\.js/i] },
  { name: "Moment.js", category: "javascript-library", scripts: [/moment(\.min)?\.js/i] },
  { name: "Day.js", category: "javascript-library", scripts: [/dayjs/i] },
  { name: "Alpine.js", category: "javascript-library", html: [/x-data=|x-init=/] },
  { name: "HTMX", category: "javascript-library", html: [/hx-get=|hx-post=|hx-target=/] },
  {
    name: "Three.js",
    category: "javascript-library",
    scripts: [/three(\.min)?\.js/i],
    html: [/THREE\.WebGLRenderer/],
  },
  { name: "D3.js", category: "javascript-library", scripts: [/d3(\.min)?\.js|d3\.v\d/i] },
  { name: "GSAP", category: "javascript-library", scripts: [/gsap|greensock/i] },
  { name: "Framer Motion", category: "javascript-library", html: [/framer-motion|data-framer-/] },
  { name: "Lottie", category: "javascript-library", scripts: [/lottie(-web)?/i] },
  { name: "Swiper", category: "javascript-library", html: [/swiper-wrapper|swiper-slide/] },
  { name: "Slick Carousel", category: "javascript-library", html: [/slick-slider|slick-track/] },
  { name: "Chart.js", category: "javascript-library", scripts: [/chart(\.min)?\.js/i] },
  {
    name: "Redux",
    category: "javascript-library",
    html: [/__REDUX_DEVTOOLS_EXTENSION__|redux-toolkit/],
  },
  { name: "Zustand", category: "javascript-library", scripts: [/zustand/i] },
  {
    name: "styled-components",
    category: "javascript-library",
    html: [/data-styled|sc-[a-zA-Z]{6}/],
  },
  { name: "Emotion", category: "javascript-library", html: [/css-\w{7,}|data-emotion/] },
  { name: "Radix UI", category: "javascript-library", html: [/data-radix-|radix-\w+/] },

  // UI Frameworks
  {
    name: "Tailwind CSS",
    category: "ui-framework",
    html: [/\btw-|tailwind|class="[^"]*\b(?:flex|grid|text-|bg-|p[xytrbl]?-\d)/i],
  },
  {
    name: "Bootstrap",
    category: "ui-framework",
    html: [/bootstrap(\.min)?\.css|class="[^"]*\bcol-(sm|md|lg|xl)-/],
  },
  { name: "Material UI", category: "ui-framework", html: [/MuiBox-root|css-\w+-Mui/] },
  { name: "Chakra UI", category: "ui-framework", html: [/chakra-/] },
  { name: "Ant Design", category: "ui-framework", html: [/ant-btn|ant-layout|antd/] },
  { name: "Bulma", category: "ui-framework", html: [/bulma/i] },
  {
    name: "shadcn/ui",
    category: "ui-framework",
    html: [/data-slot="[^"]+"|data-radix-collection-item/],
  },
  { name: "Foundation", category: "ui-framework", html: [/foundation-sites|zurb-foundation/] },
  { name: "Semantic UI", category: "ui-framework", html: [/ui (button|container|grid|segment) /] },

  // CMS
  {
    name: "WordPress",
    category: "cms",
    html: [/wp-content\/|wp-includes\/|wp-json/],
    meta: { generator: /WordPress/i },
  },
  { name: "Elementor", category: "cms", html: [/elementor-widget|elementor-element/] },
  {
    name: "Wix",
    category: "cms",
    html: [/static\.wixstatic|X-Wix-/i],
    headers: { "x-wix-request-id": /./i },
  },
  { name: "Squarespace", category: "cms", html: [/static1\.squarespace|Squarespace\./] },
  { name: "Webflow", category: "cms", html: [/webflow\.com|data-wf-page/] },
  { name: "Framer", category: "cms", html: [/framerusercontent\.com|framer\.com/] },
  {
    name: "Drupal",
    category: "cms",
    meta: { generator: /Drupal/i },
    html: [/sites\/default\/files/],
  },
  { name: "Joomla", category: "cms", meta: { generator: /Joomla/i } },
  { name: "Ghost", category: "cms", meta: { generator: /Ghost/i } },
  { name: "Contentful", category: "cms", html: [/images\.ctfassets\.net|cdn\.contentful\.com/] },
  { name: "Sanity", category: "cms", html: [/cdn\.sanity\.io|sanity-cdn/] },
  { name: "Storyblok", category: "cms", html: [/a\.storyblok\.com|storyblok\.com\//] },
  { name: "Strapi", category: "cms", html: [/strapi/i] },
  { name: "Prismic", category: "cms", html: [/prismic\.io/] },
  { name: "DatoCMS", category: "cms", html: [/datocms-assets/] },
  { name: "Builder.io", category: "cms", html: [/cdn\.builder\.io|builder\.io/] },
  { name: "TinaCMS", category: "cms", html: [/tina-cms|tina__/i] },
  { name: "Payload CMS", category: "cms", html: [/payloadcms|payload/i] },
  { name: "Directus", category: "cms", html: [/directus|directus-assets/i] },
  { name: "Contentstack", category: "cms", html: [/contentstack\.io|cdn\.contentstack/] },
  {
    name: "Custom Admin-Panel",
    category: "cms",
    html: [/href=["']\/(?:admin|dashboard)(?:\/[^"']*)?["']/i],
  },
  { name: "Sitecore", category: "cms", html: [/sitecore/i] },
  { name: "Adobe Experience Manager", category: "cms", html: [/\/etc\.clientlibs|aem-|granite\//] },
  { name: "HubSpot CMS", category: "cms", html: [/hs-scripts\.com|hubspotusercontent/] },
  { name: "Craft CMS", category: "cms", meta: { generator: /Craft CMS/i } },
  { name: "Umbraco", category: "cms", meta: { generator: /Umbraco/i } },

  // eCommerce
  {
    name: "Shopify",
    category: "ecommerce",
    html: [/cdn\.shopify\.com|Shopify\.theme/],
    headers: { "x-shopify-stage": /./i },
  },
  { name: "WooCommerce", category: "ecommerce", html: [/woocommerce/i] },
  { name: "Magento", category: "ecommerce", html: [/Magento_|mage\/cookies/] },
  { name: "PrestaShop", category: "ecommerce", meta: { generator: /PrestaShop/i } },
  { name: "BigCommerce", category: "ecommerce", html: [/cdn\d*\.bcapp\.dev|bigcommerce/i] },
  { name: "Salesforce Commerce", category: "ecommerce", html: [/demandware\.static|sfcc/i] },
  { name: "Squarespace Commerce", category: "ecommerce", html: [/sqs-block-product/] },

  // Analytics
  {
    name: "Google Analytics",
    category: "analytics",
    html: [/google-analytics\.com|gtag\/js|ga\('create/],
  },
  { name: "Google Tag Manager", category: "tag-manager", html: [/googletagmanager\.com\/gtm/] },
  { name: "Plausible", category: "analytics", html: [/plausible\.io\/js/] },
  { name: "Fathom", category: "analytics", html: [/cdn\.usefathom\.com/] },
  { name: "Matomo", category: "analytics", html: [/matomo\.js|piwik\.js/] },
  { name: "Mixpanel", category: "analytics", html: [/cdn\.mxpnl\.com|mixpanel/] },
  { name: "Hotjar", category: "analytics", html: [/static\.hotjar\.com/] },
  { name: "Amplitude", category: "analytics", html: [/cdn\.amplitude\.com/] },
  { name: "PostHog", category: "analytics", html: [/posthog/i] },
  { name: "Adobe Analytics", category: "analytics", html: [/omniture|s_code\.js|adobedtm/] },
  { name: "Umami", category: "analytics", html: [/umami\.js|data-website-id/] },
  { name: "Simple Analytics", category: "analytics", html: [/simpleanalyticscdn\.com/] },
  {
    name: "Cloudflare Web Analytics",
    category: "analytics",
    html: [/static\.cloudflareinsights\.com/],
  },
  {
    name: "Vercel Analytics",
    category: "analytics",
    html: [/\/_vercel\/insights|va\.vercel-scripts\.com/],
  },
  { name: "FullStory", category: "analytics", html: [/fullstory\.com|edge\.fullstory/] },
  { name: "LogRocket", category: "analytics", html: [/cdn\.logrocket/] },
  { name: "Mouseflow", category: "analytics", html: [/mouseflow\.com/] },
  { name: "Crazy Egg", category: "analytics", html: [/crazyegg\.com/] },
  { name: "Microsoft Clarity", category: "analytics", html: [/clarity\.ms/] },

  // CDP / Data
  { name: "Segment", category: "cdp", html: [/cdn\.segment\.com/] },
  { name: "Rudderstack", category: "cdp", html: [/rudderlabs\.com/] },
  { name: "mParticle", category: "cdp", html: [/mparticle\.com/] },
  { name: "Tealium", category: "cdp", html: [/tags\.tiqcdn\.com/] },

  // Ads / Pixel
  { name: "Meta Pixel (Facebook)", category: "ads", html: [/connect\.facebook\.net\/.+fbevents/] },
  { name: "TikTok Pixel", category: "ads", html: [/analytics\.tiktok\.com/] },
  { name: "LinkedIn Insight", category: "ads", html: [/snap\.licdn\.com/] },
  { name: "Pinterest Tag", category: "ads", html: [/s\.pinimg\.com\/ct|pintrk/] },
  { name: "X (Twitter) Pixel", category: "ads", html: [/static\.ads-twitter\.com/] },
  { name: "Snap Pixel", category: "ads", html: [/sc-static\.net\/scevent/] },
  { name: "Reddit Pixel", category: "ads", html: [/redditstatic\.com\/ads/] },
  { name: "Google Ads", category: "ads", html: [/googleadservices\.com|googlesyndication/] },
  { name: "DoubleClick", category: "ads", html: [/doubleclick\.net/] },
  { name: "Criteo", category: "ads", html: [/criteo\.net/] },

  // Payment
  { name: "Stripe", category: "payment", html: [/js\.stripe\.com/] },
  { name: "PayPal", category: "payment", html: [/paypal\.com\/sdk|paypalobjects/] },
  { name: "Klarna", category: "payment", html: [/klarna\.com/] },
  { name: "Braintree", category: "payment", html: [/braintreegateway|braintree-web/] },
  { name: "Adyen", category: "payment", html: [/adyen\.com|checkoutshopper-/] },
  { name: "Square", category: "payment", html: [/squareup\.com\/js/] },
  { name: "Afterpay", category: "payment", html: [/afterpay\.com/] },
  { name: "Affirm", category: "payment", html: [/cdn1\.affirm\.com/] },
  { name: "Apple Pay", category: "payment", html: [/apple-pay-button|ApplePaySession/] },
  { name: "Google Pay", category: "payment", html: [/pay\.google\.com\/gp/] },

  // Hosting / CDN / Server
  { name: "Cloudflare", category: "cdn", headers: { server: /cloudflare/i, "cf-ray": /./ } },
  {
    name: "Fastly",
    category: "cdn",
    headers: { "x-served-by": /cache-.*fastly/i, "x-fastly-request-id": /./ },
  },
  { name: "Akamai", category: "cdn", headers: { "x-akamai-transformed": /./ } },
  { name: "AWS CloudFront", category: "cdn", headers: { via: /cloudfront/i, "x-amz-cf-id": /./ } },
  { name: "Bunny CDN", category: "cdn", headers: { server: /BunnyCDN/i } },
  { name: "KeyCDN", category: "cdn", headers: { server: /keycdn/i } },
  { name: "jsDelivr", category: "cdn", html: [/cdn\.jsdelivr\.net/] },
  { name: "cdnjs", category: "cdn", html: [/cdnjs\.cloudflare\.com/] },
  { name: "unpkg", category: "cdn", html: [/unpkg\.com/] },
  { name: "Vercel", category: "hosting", headers: { server: /vercel|now/i, "x-vercel-id": /./ } },
  { name: "Netlify", category: "hosting", headers: { server: /netlify/i, "x-nf-request-id": /./ } },
  { name: "GitHub Pages", category: "hosting", headers: { server: /github\.com/i } },
  { name: "AWS S3", category: "hosting", headers: { server: /AmazonS3/i } },
  { name: "Cloudflare Pages", category: "hosting", headers: { "cf-pages": /./ } },
  { name: "Heroku", category: "hosting", headers: { via: /vegur/i } },
  { name: "Nginx", category: "webserver", headers: { server: /nginx/i } },
  { name: "Apache", category: "webserver", headers: { server: /apache/i } },
  { name: "LiteSpeed", category: "webserver", headers: { server: /litespeed/i } },
  { name: "Caddy", category: "webserver", headers: { server: /caddy/i } },
  { name: "IIS", category: "webserver", headers: { server: /iis|Microsoft-IIS/i } },
  { name: "OpenResty", category: "webserver", headers: { server: /openresty/i } },

  // Language
  {
    name: "PHP",
    category: "language",
    headers: { "x-powered-by": /PHP/i, "set-cookie": /PHPSESSID/i },
  },
  {
    name: "ASP.NET",
    category: "language",
    headers: { "x-powered-by": /ASP\.NET/i, "x-aspnet-version": /./ },
  },
  {
    name: "Ruby on Rails",
    category: "language",
    headers: { "x-powered-by": /Phusion Passenger|rails/i, "set-cookie": /_rails|_session_id/i },
  },
  { name: "Express (Node.js)", category: "language", headers: { "x-powered-by": /Express/i } },
  { name: "Fastify (Node.js)", category: "language", headers: { "x-powered-by": /fastify/i } },
  { name: "Koa (Node.js)", category: "language", headers: { "x-powered-by": /koa/i } },
  { name: "Hapi (Node.js)", category: "language", headers: { "x-powered-by": /hapi/i } },
  { name: "Django", category: "language", headers: { "set-cookie": /csrftoken|django/i } },
  {
    name: "Java",
    category: "language",
    headers: { "x-powered-by": /Servlet|JSP/i, "set-cookie": /JSESSIONID/ },
  },
  {
    name: "Spring Boot",
    category: "language",
    headers: { "x-application-context": /./ },
  },
  {
    name: "Go",
    category: "language",
    headers: { server: /Go-HTTP|golang/i },
  },
  {
    name: "TypeScript",
    category: "language",
    html: [/\.tsx?(\?|"|')/, /sourceMappingURL=[^"']+\.ts/],
  },

  // Database / Backend
  { name: "Supabase", category: "database", html: [/supabase\.co|supabase\.io/] },
  {
    name: "Firebase",
    category: "database",
    html: [/firebaseio\.com|firebasestorage|firebase-config|firebaseapp\.com/],
  },
  { name: "MongoDB Realm", category: "database", html: [/realm\.mongodb\.com/] },
  { name: "Hasura", category: "database", html: [/hasura\.app/] },
  { name: "Amazon DynamoDB", category: "database", html: [/dynamodb\./] },

  // Auth
  { name: "Auth0", category: "auth", html: [/auth0\.com|cdn\.auth0/] },
  { name: "Okta", category: "auth", html: [/okta\.com|okta-signin-widget/] },
  { name: "Clerk", category: "auth", html: [/clerk\.accounts\.dev|clerk\./] },
  { name: "Firebase Auth", category: "auth", html: [/firebase\/auth|GoogleAuthProvider/] },

  // Fonts
  { name: "Google Fonts", category: "font", html: [/fonts\.googleapis\.com|fonts\.gstatic\.com/] },
  { name: "Adobe Fonts (Typekit)", category: "font", html: [/use\.typekit\.net/] },
  { name: "Font Awesome", category: "font", html: [/font-?awesome/i] },
  { name: "Bunny Fonts", category: "font", html: [/fonts\.bunny\.net/] },

  // Marketing / CRM / Chat
  { name: "Intercom", category: "chat", html: [/widget\.intercom\.io/] },
  { name: "HubSpot", category: "marketing", html: [/js\.hs-scripts\.com|hs-analytics/] },
  { name: "Zendesk", category: "chat", html: [/static\.zdassets\.com|zendesk/] },
  { name: "Drift", category: "chat", html: [/js\.driftt\.com/] },
  { name: "Crisp", category: "chat", html: [/client\.crisp\.chat/] },
  { name: "Tawk.to", category: "chat", html: [/embed\.tawk\.to/] },
  { name: "LiveChat", category: "chat", html: [/cdn\.livechatinc\.com/] },
  { name: "Freshchat", category: "chat", html: [/wchat\.freshchat\.com/] },
  { name: "Mailchimp", category: "email", html: [/list-manage\.com|mailchimp/] },
  { name: "Klaviyo", category: "email", html: [/klaviyo\.com|static\.klaviyo/] },
  { name: "ConvertKit", category: "email", html: [/convertkit\.com/] },
  { name: "ActiveCampaign", category: "email", html: [/activecampaign\.com|trackcmp\.net/] },
  { name: "Brevo (Sendinblue)", category: "email", html: [/sibautomation\.com|sendinblue/] },
  { name: "Marketo", category: "email", html: [/marketo\.net/] },

  // Consent / Privacy
  { name: "OneTrust", category: "privacy", html: [/onetrust|cookielaw\.org/] },
  { name: "Cookiebot", category: "privacy", html: [/consent\.cookiebot\.com/] },
  { name: "Usercentrics", category: "privacy", html: [/usercentrics\.eu|app\.usercentrics/] },
  { name: "Iubenda", category: "privacy", html: [/iubenda\.com/] },
  { name: "CookieYes", category: "privacy", html: [/cookieyes\.com|cky-consent/] },
  { name: "Osano", category: "privacy", html: [/osano\.com|osano-compliance/] },
  { name: "Termly", category: "privacy", html: [/termly\.io|termly-consent/] },
  { name: "Traffict", category: "privacy", html: [/traffict\.digital|traffict-consent/] },

  // Security / Captchas
  { name: "reCAPTCHA", category: "security", html: [/google\.com\/recaptcha/] },
  {
    name: "Cloudflare Turnstile",
    category: "security",
    html: [/challenges\.cloudflare\.com\/turnstile/],
  },
  { name: "hCaptcha", category: "security", html: [/hcaptcha\.com/] },

  // Error tracking
  { name: "Sentry", category: "error-tracking", html: [/sentry-cdn\.com|browser\.sentry-cdn/] },
  {
    name: "Bugsnag",
    category: "error-tracking",
    html: [/d2wy8f7a9ursnm\.cloudfront\.net|bugsnag/],
  },
  { name: "Rollbar", category: "error-tracking", html: [/cdn\.rollbar\.com/] },
  { name: "Datadog RUM", category: "error-tracking", html: [/datadoghq-browser-agent/] },
  { name: "New Relic", category: "error-tracking", html: [/nr-data\.net|newrelic/] },

  // Search
  { name: "Algolia", category: "search", html: [/algolia\.net|algoliasearch/] },
  { name: "Elasticsearch", category: "search", html: [/elastic\.co\/site-search/] },

  // Media
  { name: "Cloudinary", category: "media", html: [/res\.cloudinary\.com/] },
  { name: "imgix", category: "media", html: [/imgix\.net/] },
  { name: "YouTube Embed", category: "media", html: [/youtube\.com\/embed|youtube-nocookie/] },
  { name: "Vimeo Embed", category: "media", html: [/player\.vimeo\.com/] },
  { name: "Mux", category: "media", html: [/stream\.mux\.com|mux\.com\/player/] },
];

function extractInlineScripts(html: string): string {
  const parts: string[] = [];
  for (const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
    const src = m[0].match(/src=["']([^"']+)["']/i)?.[1] ?? "";
    if (!src) parts.push(m[1]);
  }
  return parts.join("\n");
}

function detectTech(
  html: string,
  headers: Record<string, string>,
  cookieNames: string[],
): TechHit[] {
  const hits: TechHit[] = [];
  const seen = new Set<string>();
  const inlineScriptText = extractInlineScripts(html);

  for (const fp of FINGERPRINTS) {
    let confidence = 0;
    const evidence: string[] = [];

    if (fp.html) {
      for (const re of fp.html) {
        const m = html.match(re);
        if (m) {
          confidence += 40;
          evidence.push(`html: ${m[0].slice(0, 40)}`);
          break;
        }
      }
    }
    if (fp.scripts) {
      for (const re of fp.scripts) {
        const m = html.match(re);
        if (m) {
          confidence += 40;
          evidence.push(`script: ${m[0].slice(0, 40)}`);
          break;
        }
      }
    }
    if (fp.inlineScripts) {
      for (const re of fp.inlineScripts) {
        const m = inlineScriptText.match(re);
        if (m) {
          confidence += 35;
          evidence.push(`inline: ${m[0].slice(0, 40)}`);
          break;
        }
      }
    }
    if (fp.headers) {
      for (const [key, re] of Object.entries(fp.headers)) {
        const v = headers[key.toLowerCase()];
        if (v && re.test(v)) {
          confidence += 50;
          evidence.push(`${key}: ${v.slice(0, 40)}`);
        }
      }
    }
    if (fp.cookies) {
      for (const re of fp.cookies) {
        if (cookieNames.some((n) => re.test(n))) {
          confidence += 30;
          evidence.push(`cookie match`);
          break;
        }
      }
    }
    if (fp.meta) {
      for (const [key, re] of Object.entries(fp.meta)) {
        const metaRe = new RegExp(
          `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`,
          "i",
        );
        const m = html.match(metaRe);
        if (m && re.test(m[1])) {
          confidence += 60;
          evidence.push(`meta ${key}: ${m[1].slice(0, 40)}`);
        }
      }
    }

    if (confidence > 0 && !seen.has(fp.name)) {
      seen.add(fp.name);
      hits.push({
        name: fp.name,
        category: fp.category,
        confidence: Math.min(confidence, 100),
        evidence: evidence.join(" · "),
      });
    }
  }

  return hits;
}

function pickAttr(html: string, tag: string, attr: string, valAttr = "content"): string | null {
  const re = new RegExp(
    `<${tag}[^>]*\\b${attr}=["']([^"']+)["'][^>]*\\b${valAttr}=["']([^"']*)["']`,
    "i",
  );
  const m1 = html.match(re);
  if (m1) return m1[2];
  const re2 = new RegExp(
    `<${tag}[^>]*\\b${valAttr}=["']([^"']*)["'][^>]*\\b${attr}=["']([^"']+)["']`,
    "i",
  );
  const m2 = html.match(re2);
  if (m2) return m2[1];
  return null;
}

function absoluteUrl(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 15000,
): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...opts,
      signal: ctl.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; SiteScopeBot/1.0; +https://sitescope.app) Chrome/120",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...(opts.headers as Record<string, string> | undefined),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

function extractApiRoutes(html: string): string[] {
  const apiSegments = "(?:api|wp-json|graphql|trpc|_next\\/data|server|rest|v\\d+)";
  const backendSegments =
    "(?:admin|dashboard|login|cms|wp-admin|ghost|strapi(?:/admin)?|studio|panel|keystone|sanity|backend|manage|account)";
  const patterns = [
    new RegExp(
      `(?:href|src|action|fetch\\s*\\(\\s*["'])\\s*([^"'\\s]*\\/${apiSegments}\\/[^"'\\s]*)`,
      "gi",
    ),
    new RegExp(`fetch\\s*\\(\\s*["']([^"'\\s]*\\/${apiSegments}\\/[^"'\\s]*)["']`, "gi"),
    new RegExp(`["']([^"'\\s]*\\/${apiSegments}\\/[^"'\\s]*)["']`, "gi"),
    new RegExp(`(?:href|action)=["']([^"']*\\/${backendSegments}(?:/[^"']*)?)["']`, "gi"),
  ];
  const found = new Set<string>();
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const route = m[1] ?? m[0];
      if (route) found.add(route.replace(/^["']|["']$/g, ""));
    }
  }
  return [...found].slice(0, 25);
}

async function fetchImpressumHtml(
  baseUrl: string,
  knownHtml: string,
): Promise<{ url: string | null; html: string | null }> {
  const candidates = ["/impressum", "/imprint", "/legal", "/legal-notice"];
  for (const path of candidates) {
    const url = new URL(path, baseUrl).toString();
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; SiteScopeBot/1.0; +https://sitescope.app) Chrome/120",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (res.ok && res.headers.get("content-type")?.includes("text/html")) {
        const text = await res.text();
        if (text.length > 100) return { url, html: text };
      }
    } catch {
      // ignore
    }
  }
  // Fallback: search current page for imprint link
  const imprintMatch = knownHtml.match(/href=["']([^"']*(?:impressum|imprint|legal)[^"']*)["']/i);
  if (imprintMatch) {
    const url = new URL(imprintMatch[1], baseUrl).toString();
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; SiteScopeBot/1.0; +https://sitescope.app) Chrome/120",
        },
      });
      if (res.ok) return { url, html: await res.text() };
    } catch {
      // ignore
    }
  }
  return { url: null, html: null };
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOperator(html: string, sourceUrl: string | null): AnalyzeResult["operator"] {
  const text = stripHtmlTags(html);
  // Some SPAs ship imprint data only in the meta description fallback
  const metaDescMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );
  const metaDesc = metaDescMatch?.[1] ?? "";
  const operator: AnalyzeResult["operator"] = {
    name: null,
    address: null,
    email: null,
    phone: null,
    sourceUrl,
  };

  const searchSources = [text, metaDesc].filter(Boolean);
  for (const src of searchSources) {
    const emailMatch = src.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
    if (emailMatch && !operator.email) operator.email = emailMatch[0];

    const phoneMatch = src.match(/(?:Tel|Telefon|Phone)[:\s]*([\d\s/+\-()]{6,})/i);
    if (phoneMatch && !operator.phone) operator.phone = phoneMatch[1].trim();
  }

  const labels = [
    "Angaben gemäß § 5 TMG",
    "Angaben gemäß § 5 DDG",
    "Vertreten durch",
    "Verantwortlich",
    "Geschäftsführer",
    "Inhaber",
    "Betreiber",
    "Provider",
    "Herausgeber",
  ];
  let bestName: string | null = null;
  let bestAddress: string | null = null;

  for (const src of searchSources) {
    for (const label of labels) {
      const re = new RegExp(`${label}[\\s:]*([^\\n]{3,120})`, "i");
      const m = src.match(re);
      if (m && !bestName) {
        bestName = m[1].trim();
      }
    }

    const tmBlock = src.match(
      /(?:Angaben gemäß § 5 (?:TMG|DDG)|Vertreten durch)[\s:]*([^\n]{3,200})(?:\s*[^\n]{0,200})?/i,
    );
    if (tmBlock) {
      const lines = tmBlock[0]
        .split(/\n|\s{2,}/)
        .map((l) => l.trim())
        .filter((l) => l.length > 2);
      if (lines.length > 1 && !bestName) bestName = lines[1];
      if (lines.length > 2 && !bestAddress) bestAddress = lines.slice(2).join(", ");
    }
  }

  // Fallback for SPAs that only expose operator data in meta description like:
  // "Angaben gemäß § 5 TMG: Heiko Merkel, Heckenweg 16, 04349 Leipzig"
  if (!bestName && metaDesc.includes("§ 5 TMG")) {
    const parts = metaDesc.split(/[:-]/);
    const afterTmg = parts.length > 1 ? parts.slice(1).join(":").trim() : metaDesc;
    const [namePart, ...addrParts] = afterTmg.split(",");
    if (namePart) bestName = namePart.trim();
    if (addrParts.length) bestAddress = addrParts.join(",").trim();
  }

  operator.name = bestName;
  operator.address = bestAddress;
  return operator;
}

async function lookupHostingDetails(hostname: string): Promise<AnalyzeResult["hostingDetails"]> {
  const empty: AnalyzeResult["hostingDetails"] = {
    ip: null,
    isp: null,
    org: null,
    country: null,
    region: null,
    nameservers: [],
    mx: [],
    txt: [],
  };

  try {
    const [aRecords, nsRecords, mxRecords, txtRecords] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolveNs(hostname),
      dns.resolveMx(hostname),
      dns.resolveTxt(hostname),
    ]);

    empty.ip = aRecords.status === "fulfilled" && aRecords.value.length ? aRecords.value[0] : null;
    empty.nameservers =
      nsRecords.status === "fulfilled" ? nsRecords.value.map((r) => String(r)) : [];
    empty.mx =
      mxRecords.status === "fulfilled"
        ? mxRecords.value.map((r) => `${r.priority} ${r.exchange}`)
        : [];
    empty.txt =
      txtRecords.status === "fulfilled"
        ? txtRecords.value.map((arr) => arr.join("")).slice(0, 10)
        : [];
  } catch {
    // ignore
  }

  if (empty.ip) {
    try {
      const res = await fetch(
        `http://ip-api.com/json/${empty.ip}?fields=isp,org,country,regionName`,
        {
          headers: { accept: "application/json" },
        },
      );
      if (res.ok) {
        const data = await res.json();
        empty.isp = data.isp ?? null;
        empty.org = data.org ?? null;
        empty.country = data.country ?? null;
        empty.region = data.regionName ?? null;
      }
    } catch {
      // ignore
    }
  }

  return empty;
}

async function lookupApiHosting(domain: string): Promise<AnalyzeResult["backendHosting"][number]> {
  const result: AnalyzeResult["backendHosting"][number] = {
    domain,
    ip: null,
    isp: null,
    org: null,
    country: null,
    region: null,
    nameservers: [],
  };

  try {
    const [aRecords, nsRecords] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolveNs(domain),
    ]);
    result.ip = aRecords.status === "fulfilled" && aRecords.value.length ? aRecords.value[0] : null;
    result.nameservers =
      nsRecords.status === "fulfilled" ? nsRecords.value.map((r) => String(r)) : [];
  } catch {
    // ignore
  }

  if (result.ip) {
    try {
      const res = await fetch(
        `http://ip-api.com/json/${result.ip}?fields=isp,org,country,regionName`,
        {
          headers: { accept: "application/json" },
        },
      );
      if (res.ok) {
        const data = await res.json();
        result.isp = data.isp ?? null;
        result.org = data.org ?? null;
        result.country = data.country ?? null;
        result.region = data.regionName ?? null;
      }
    } catch {
      // ignore
    }
  }

  return result;
}

async function extractExternalApiDomains(html: string, baseUrl: string): Promise<string[]> {
  const domains = new Set<string>();
  const baseHostname = new URL(baseUrl).hostname;

  // 1) collect absolute script URLs from the page
  const scriptUrls: string[] = [];
  for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
    try {
      const url = new URL(m[1], baseUrl).toString();
      if (url.startsWith("http")) scriptUrls.push(url);
    } catch {
      // ignore
    }
  }

  // 2) fetch a few scripts and search for fetch/xhr/axios targets
  const candidates = scriptUrls.slice(0, 8);
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; SiteScopeBot/1.0; +https://sitescope.app) Chrome/120",
        },
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length > 500_000) continue;

      const apiPatterns = [
        /(?:fetch|axios|\.get|\.post|\.put|\.delete)\s*\(\s*["'`](https?:\/\/[^"'`\s]+)["'`]/gi,
        /["'`](https?:\/\/[^"'`\s]*\/(?:api|graphql|v\d+|wp-json|trpc|rpc)[^"'`\s]*)["'`]/gi,
        /https?:\/\/[^"'`\s)]+\.(?:supabase\.co|firebaseio\.com|appspot\.com|aws\.amazonaws\.com|cloudfunctions\.net|vercel\.app|netlify\.app|pages\.dev|herokuapp\.com|onrender\.com|railway\.app)/gi,
      ];
      for (const re of apiPatterns) {
        for (const match of text.matchAll(re)) {
          const found = match[1] ?? match[0];
          try {
            const u = new URL(found);
            if (u.hostname !== baseHostname && !u.hostname.includes(baseHostname)) {
              domains.add(`${u.hostname}${u.pathname}`);
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 3) also scan initial HTML for absolute API-like URLs
  for (const re of [
    /https?:\/\/[^"'<>\s]+\/(?:api|graphql|v\d+|wp-json|trpc|rpc)[^"'<>\s]*/gi,
    /https?:\/\/[^"'<>\s]+\.(?:supabase\.co|firebaseio\.com|appspot\.com|aws\.amazonaws\.com|cloudfunctions\.net|vercel\.app|netlify\.app|pages\.dev|herokuapp\.com|onrender\.com|railway\.app)[^"'<>\s]*/gi,
  ]) {
    for (const m of html.matchAll(re)) {
      try {
        const u = new URL(m[0]);
        if (u.hostname !== baseHostname) domains.add(`${u.hostname}${u.pathname}`);
      } catch {
        // ignore
      }
    }
  }

  return [...domains].slice(0, 20);
}

function buildArchitecture(
  tech: TechHit[],
  headers: Record<string, string>,
  html: string,
): AnalyzeResult["architecture"] {
  const names = new Set(tech.map((t) => t.name));
  const inCategory = (...cats: TechCategory[]) =>
    tech.filter((t) => cats.includes(t.category)).map((t) => t.name);

  const frontend = inCategory("javascript-framework", "javascript-library", "ui-framework");
  const backend = inCategory("language");
  const server = inCategory("webserver");
  const hosting = inCategory("hosting", "cdn");
  const cms = inCategory("cms", "ecommerce");
  const languages = inCategory("language");
  const apiRoutes = extractApiRoutes(html);

  const serverHeader = headers["server"];
  if (serverHeader && !server.length) {
    server.push(serverHeader.split("/")[0]);
  }

  const parts: string[] = [];
  if (cms.length) parts.push(`CMS/Shop-System: ${cms.join(", ")}`);
  if (frontend.length) parts.push(`Frontend: ${frontend.join(", ")}`);
  if (backend.length || languages.length)
    parts.push(`Backend/Sprache: ${[...new Set([...backend, ...languages])].join(", ")}`);
  if (apiRoutes.length) parts.push(`${apiRoutes.length} Backend-Route(n) erkannt`);
  if (hosting.length) parts.push(`Hosting/CDN: ${hosting.join(", ")}`);
  if (server.length) parts.push(`Webserver: ${server.join(", ")}`);

  const summary =
    parts.length > 0
      ? `Aufbau erkannt: ${parts.join(" · ")}.`
      : "Keine klare Architektur erkannt – wahrscheinlich statisches HTML oder verschleierte Header.";

  return {
    frontend,
    backend,
    server,
    hosting,
    cms,
    languages,
    apiRoutes,
    summary,
  };
}

function buildSocialHowTo(
  foundSocials: { platform: string; url: string }[],
  tech: TechHit[],
): AnalyzeResult["socialHowTo"] {
  const found = new Set(foundSocials.map((s) => s.platform));
  const cms = tech.find((t) => t.category === "cms")?.name.toLowerCase();
  const isWordPress = cms?.includes("wordpress");
  const isShopify = cms?.includes("shopify");
  const isSquarespace = cms?.includes("squarespace");
  const isWix = cms?.includes("wix");
  const isWebflow = cms?.includes("webflow");

  const common: AnalyzeResult["socialHowTo"] = [
    {
      platform: "Allgemein",
      where:
        'Social-Links gehören meist in den Footer oder die Kontakt-Seite. Im Quelltext sind das einfache <a href="https://...">-Tags zur jeweiligen Plattform.',
    },
  ];

  if (isWordPress) {
    common.push({
      platform: "WordPress",
      where:
        "Widgets → Social Icons, Customizer → Theme-Optionen oder direkt im Footer-Template (Appearance → Theme File Editor).",
    });
  } else if (isShopify) {
    common.push({
      platform: "Shopify",
      where:
        "Online Store → Themes → Customize → Footer / Header → füge Social-Media-Accounts in den Theme-Einstellungen hinzu.",
    });
  } else if (isSquarespace) {
    common.push({
      platform: "Squarespace",
      where: "Edit Site → Header / Footer → Social Links Block oder Settings → Social Links.",
    });
  } else if (isWix) {
    common.push({
      platform: "Wix",
      where: "Editor → Add → Social Bar oder Site Menu & Pages → Social Links.",
    });
  } else if (isWebflow) {
    common.push({
      platform: "Webflow",
      where:
        "Designer → Symbols / Navbar → füge im Footer manuell Link-Blöcke mit den Social-URLs hinzu.",
    });
  } else {
    common.push({
      platform: "Custom Code",
      where:
        "Suche im Projekt nach dem Footer-Komponenten (z. B. Footer.tsx, footer.php, layout.html). Social-URLs werden dort als <a>-Tags gepflegt.",
    });
  }

  const platforms: Record<string, string> = {
    Twitter: "X / Twitter",
    Facebook: "Facebook",
    Instagram: "Instagram",
    LinkedIn: "LinkedIn",
    YouTube: "YouTube",
    TikTok: "TikTok",
    GitHub: "GitHub",
    Discord: "Discord",
  };

  for (const [key, label] of Object.entries(platforms)) {
    if (!found.has(key)) {
      common.push({
        platform: label,
        where: `Noch nicht gefunden. Füge den Profil-Link (https://${key === "Twitter" ? "x.com" : label.toLowerCase() + ".com"}/...) in die Social-Media-Sektion des Footers ein.`,
      });
    }
  }

  return common;
}

export const analyzeSite = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const startUrl = normalizeUrl(data.url);
    const errors: string[] = [];
    const warnings: string[] = [];

    const tStart = Date.now();
    let response: Response;
    let ttfb = 0;
    try {
      const t1 = Date.now();
      response = await fetchWithTimeout(startUrl);
      ttfb = Date.now() - t1;
    } catch (e) {
      throw new Error(`Could not reach ${startUrl}: ${e instanceof Error ? e.message : String(e)}`);
    }

    const html = await response.text();
    const total = Date.now() - tStart;
    const finalUrl = response.url || startUrl;
    const origin = new URL(finalUrl).origin;

    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

    // Cookies
    const setCookies: string[] = [];
    const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] })
      .getSetCookie;
    if (typeof getSetCookie === "function") setCookies.push(...getSetCookie.call(response.headers));
    else if (headers["set-cookie"]) setCookies.push(headers["set-cookie"]);
    const cookies = setCookies.map((c) => {
      const [pair, ...attrs] = c.split(";").map((s) => s.trim());
      const name = pair.split("=")[0];
      const attrStr = attrs.join(";").toLowerCase();
      const sameSiteMatch = attrStr.match(/samesite=(\w+)/);
      return {
        name,
        secure: /secure/i.test(attrStr),
        httpOnly: /httponly/i.test(attrStr),
        sameSite: sameSiteMatch ? sameSiteMatch[1] : null,
      };
    });

    // Meta extraction
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    const description =
      pickAttr(html, "meta", "name", "content") && /name=["']description["']/i.test(html)
        ? (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
          null)
        : null;
    const canonical =
      html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? null;
    const lang = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? null;
    const favicon =
      html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
      null;
    const ogImage =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
    const ogTitle =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
    const ogDescription =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      null;
    const twitterCard =
      html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
    const viewport =
      html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
    const charset = html.match(/<meta[^>]+charset=["']?([^"'\s>]+)/i)?.[1] ?? null;
    const generator =
      html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
    const themeColor =
      html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
    const author =
      html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
    const robotsMeta =
      html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;

    // Headings
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);
    const h2Count = (html.match(/<h2\b/gi) || []).length;
    const h3Count = (html.match(/<h3\b/gi) || []).length;

    // Links & assets
    const scriptSrcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) =>
      absoluteUrl(finalUrl, m[1]),
    );
    const styleHrefs = [
      ...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi),
    ].map((m) => absoluteUrl(finalUrl, m[1]));
    const imgSrcs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) =>
      absoluteUrl(finalUrl, m[1]),
    );
    const anchorHrefs = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)].map((m) =>
      absoluteUrl(finalUrl, m[1]),
    );
    let internal = 0,
      external = 0;
    for (const h of anchorHrefs) {
      try {
        const u = new URL(h);
        if (u.origin === origin) internal++;
        else if (u.protocol.startsWith("http")) external++;
      } catch {
        /* skip */
      }
    }

    // Socials
    const socialMap: Record<string, RegExp> = {
      Twitter: /(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+/i,
      Facebook: /facebook\.com\/[A-Za-z0-9.\-_]+/i,
      Instagram: /instagram\.com\/[A-Za-z0-9._]+/i,
      LinkedIn: /linkedin\.com\/(?:company|in)\/[A-Za-z0-9\-_]+/i,
      YouTube: /youtube\.com\/(?:@|channel|user)\/?[A-Za-z0-9\-_]+/i,
      TikTok: /tiktok\.com\/@[A-Za-z0-9._]+/i,
      GitHub: /github\.com\/[A-Za-z0-9\-_]+/i,
      Discord: /discord\.(?:gg|com\/invite)\/[A-Za-z0-9]+/i,
    };
    const socials: { platform: string; url: string }[] = [];
    for (const [platform, re] of Object.entries(socialMap)) {
      const m = html.match(re);
      if (m) socials.push({ platform, url: "https://" + m[0].replace(/^https?:\/\//, "") });
    }

    // Tech detection
    const cookieNames = cookies.map((c) => c.name);
    const tech = detectTech(html, headers, cookieNames);
    // Push generator meta as evidence for CMS if any
    if (
      generator &&
      !tech.some((t) => t.name.toLowerCase() === generator.toLowerCase().split(" ")[0])
    ) {
      tech.push({
        name: generator,
        category: "cms",
        confidence: 70,
        evidence: `meta generator: ${generator}`,
      });
    }

    // Security headers
    const sec = (
      name: string,
      ok: (v: string | null) => boolean,
      advice: string,
      howToFix: string,
      location: string,
      learnMore: string,
    ): SecurityHeader => {
      const v = headers[name] ?? null;
      const passed = ok(v);
      return {
        name,
        value: v,
        ok: passed,
        advice: passed ? undefined : advice,
        howToFix: passed ? undefined : howToFix,
        location: passed ? undefined : location,
        learnMore: passed ? undefined : learnMore,
      };
    };
    const securityHeaders: SecurityHeader[] = [
      sec(
        "strict-transport-security",
        (v) => !!v && /max-age=\d+/.test(v),
        "Füge HSTS mit einer langen max-age hinzu, um HTTPS zu erzwingen.",
        "Setze den Header Strict-Transport-Security: max-age=31536000; includeSubDomains; preload. Bei NGINX: add_header Strict-Transport-Security ...; bei Vercel/Netlify über _headers oder Edge-Config.",
        "Server-Konfiguration (nginx.conf, .htaccess, _headers, Cloudflare Transform Rules).",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
      ),
      sec(
        "content-security-policy",
        (v) => !!v,
        "Füge eine Content-Security-Policy hinzu, um XSS zu verhindern.",
        "Starte mit einer Report-Only Policy (Content-Security-Policy-Report-Only), logge Verstöße und verschärfe dann. Beispiel: default-src 'self'; script-src 'self'; object-src 'none'.",
        "Webserver/CDN-Konfiguration oder Meta-Tag im <head> (nicht empfohlen für alle Direktiven).",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy",
      ),
      sec(
        "x-content-type-options",
        (v) => v?.toLowerCase() === "nosniff",
        "Setze X-Content-Type-Options auf nosniff.",
        "Füge den Header X-Content-Type-Options: nosniff in der Server-Konfiguration hinzu.",
        "Webserver-Konfiguration (nginx.conf, .htaccess, Vercel _headers).",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options",
      ),
      sec(
        "x-frame-options",
        (v) => !!v && /(deny|sameorigin)/i.test(v),
        "Schütze vor Clickjacking mit X-Frame-Options.",
        "Setze X-Frame-Options: DENY oder SAMEORIGIN. Alternativ/ergänzend frame-ancestors in der CSP.",
        "Webserver/CDN-Konfiguration.",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
      ),
      sec(
        "referrer-policy",
        (v) => !!v,
        "Setze eine Referrer-Policy.",
        "Empfohlener Wert: Referrer-Policy: strict-origin-when-cross-origin. Vermeidet zu viele Daten an externe Seiten.",
        'Webserver/CDN-Konfiguration oder <meta name="referrer" content="strict-origin-when-cross-origin"> im <head>.',
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy",
      ),
      sec(
        "permissions-policy",
        (v) => !!v,
        "Beschränke leistungsstarke Browser-Features mit Permissions-Policy.",
        "Beispiel: Permissions-Policy: geolocation=(), microphone=(), camera=(). Passe anhand der tatsächlich genutzten APIs an.",
        "Webserver/CDN-Konfiguration.",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy",
      ),
      sec(
        "cross-origin-opener-policy",
        (v) => !!v,
        "Füge COOP für Cross-Origin-Isolation hinzu.",
        "Setze Cross-Origin-Opener-Policy: same-origin. Damit wird das Fenster von fremden Ursprüngen isoliert.",
        "Webserver/CDN-Konfiguration.",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy",
      ),
      sec(
        "x-xss-protection",
        (v) => v === null || v === "0",
        "Setze X-XSS-Protection auf 0 oder lasse den Header weg.",
        "Moderne Browser vertrauen auf CSP. Header setzen: X-XSS-Protection: 0.",
        "Webserver/CDN-Konfiguration.",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection",
      ),
    ];

    // SEO checks
    const imgTags = html.match(/<img\b[^>]*>/gi) || [];
    const imgCount = imgTags.length;
    const imgWithAlt = imgTags.filter((t) => /\balt=/i.test(t)).length;

    const seoChecks: SeoCheck[] = [
      {
        key: "title",
        label: "Title tag",
        ok: !!title && title.length >= 10 && title.length <= 65,
        value: title ?? "—",
        advice: !title
          ? "<title> fehlt."
          : title.length < 10
            ? "Title ist zu kurz."
            : title.length > 65
              ? "Title über 65 Zeichen wird in SERPs gekürzt."
              : undefined,
        howToFix: !title
          ? "Füge im <head> ein: <title>Meine Seite | Keyword</title>."
          : title.length < 10
            ? "Erweitere den Title auf 30–60 Zeichen mit relevantem Keyword."
            : title.length > 65
              ? "Kürze den Title auf maximal 60 Zeichen."
              : undefined,
        location: "HTML <head> / Template (index.html, layout.tsx, _document.js, header.php).",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title",
      },
      {
        key: "description",
        label: "Meta description",
        ok: !!description && description.length >= 50 && description.length <= 165,
        value: description ?? "—",
        advice: !description
          ? "Meta description fehlt."
          : description.length < 50
            ? "Description zu kurz."
            : description.length > 165
              ? "Description über 165 Zeichen wird gekürzt."
              : undefined,
        howToFix: !description
          ? 'Füge im <head> hinzu: <meta name="description" content="...">.'
          : description.length < 50
            ? "Schreibe 1–2 Sätze mit Call-to-Action und Keyword (50–160 Zeichen)."
            : description.length > 165
              ? "Kürze die Description auf ~155 Zeichen."
              : undefined,
        location: "HTML <head> / SEO-Plugin (Yoast, RankMath, All in One SEO).",
        learnMore:
          "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Tutorial#the_description_metadata",
      },
      {
        key: "h1",
        label: "Single H1",
        ok: h1s.length === 1,
        value: `${h1s.length} found`,
        advice:
          h1s.length === 0
            ? "Keine H1 auf der Seite."
            : h1s.length > 1
              ? "Mehrere H1s; verwende nur eine pro Seite."
              : undefined,
        howToFix:
          h1s.length === 0
            ? "Füge am Anfang des Hauptinhalts genau eine <h1> mit Hauptkeyword hinzu."
            : h1s.length > 1
              ? "Wandle zusätzliche <h1> in <h2> um."
              : undefined,
        location: "Seiten-Template oder Editor-Inhalt (page.tsx, single.php, content).",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements",
      },
      {
        key: "canonical",
        label: "Canonical URL",
        ok: !!canonical,
        value: canonical ?? "—",
        advice: !canonical ? 'Füge <link rel="canonical"> hinzu.' : undefined,
        howToFix:
          'Füge im <head> ein: <link rel="canonical" href="https://deine-domain.de/diese-seite/">.',
        location: "HTML <head> / Template / SEO-Plugin.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel#canonical",
      },
      {
        key: "viewport",
        label: "Viewport meta",
        ok: !!viewport,
        value: viewport ?? "—",
        advice: !viewport ? "Viewport-Meta-Tag für Mobile fehlt." : undefined,
        howToFix:
          'Füge im <head> hinzu: <meta name="viewport" content="width=device-width, initial-scale=1">.',
        location: "HTML <head> / Template.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag",
      },
      {
        key: "lang",
        label: "HTML lang attribute",
        ok: !!lang,
        value: lang ?? "—",
        advice: !lang ? 'Setze <html lang="...">.' : undefined,
        howToFix: 'Setze das lang-Attribut auf der <html>-Wurzel, z. B. <html lang="de">.',
        location: "Root-Template (index.html, _document.js, layout.tsx).",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang",
      },
      {
        key: "og",
        label: "Open Graph tags",
        ok: !!(ogTitle && ogDescription && ogImage),
        value: [ogTitle, ogDescription, ogImage].filter(Boolean).length + "/3",
        advice: "Füge og:title, og:description, og:image für Rich Sharing hinzu.",
        howToFix:
          'Füge im <head> hinzu: <meta property="og:title" content="...">, og:description, og:image (1200×630 px).',
        location: "HTML <head> / Template / SEO-Plugin.",
        learnMore: "https://ogp.me/",
      },
      {
        key: "twitter",
        label: "Twitter card",
        ok: !!twitterCard,
        value: twitterCard ?? "—",
        advice: !twitterCard ? "Twitter-Card Meta-Tag fehlt." : undefined,
        howToFix:
          'Füge hinzu: <meta name="twitter:card" content="summary_large_image"> und ggf. twitter:title, twitter:image.',
        location: "HTML <head> / Template.",
        learnMore:
          "https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup",
      },
      {
        key: "favicon",
        label: "Favicon",
        ok: !!favicon,
        value: favicon ?? "—",
        advice: !favicon ? "Kein Favicon gefunden." : undefined,
        howToFix:
          "Lege ein Favicon (z. B. /favicon.ico oder /favicon.svg) ab und verlinke es im <head>.",
        location: "public/-Ordner oder Root des Webservers; Verlinkung im <head>.",
        learnMore:
          "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/What_is_in_the_head_metadata_in_HTML#adding_custom_icons_to_your_site",
      },
      {
        key: "robotsMeta",
        label: "Not blocked by robots meta",
        ok: !robotsMeta || !/noindex/i.test(robotsMeta),
        value: robotsMeta ?? "index,follow (default)",
        advice:
          robotsMeta && /noindex/i.test(robotsMeta)
            ? "Seite wird per robots-Meta von der Indexierung ausgeschlossen."
            : undefined,
        howToFix:
          robotsMeta && /noindex/i.test(robotsMeta)
            ? 'Entferne noindex oder passe an: <meta name="robots" content="index,follow">.'
            : undefined,
        location: "HTML <head> / SEO-Plugin / Template.",
        learnMore: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag",
      },
      {
        key: "alt",
        label: "Images have alt text",
        ok: imgCount === 0 || imgWithAlt / imgCount >= 0.8,
        value: `${imgWithAlt}/${imgCount} images`,
        advice:
          imgCount > 0 && imgWithAlt / imgCount < 0.8 ? "Viele Bilder ohne Alt-Text." : undefined,
        howToFix:
          imgCount > 0 && imgWithAlt / imgCount < 0.8
            ? "Füge allen inhaltlich relevanten <img> ein alt-Attribut hinzu (Beschreibung oder leer bei Dekobildern)."
            : undefined,
        location: "HTML/Template/Editor-Inhalt.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#alt",
      },
      {
        key: "https",
        label: "HTTPS",
        ok: finalUrl.startsWith("https://"),
        value: finalUrl.startsWith("https://") ? "yes" : "no",
        advice: !finalUrl.startsWith("https://")
          ? "Seite ist nicht per HTTPS erreichbar."
          : undefined,
        howToFix: !finalUrl.startsWith("https://")
          ? "Aktiviere SSL/TLS beim Hosting-Anbieter oder über ein kostenloses Let's Encrypt-Zertifikat."
          : undefined,
        location: "Hosting-/Server-Konfiguration (z. B. Vercel, Netlify, NGINX, Apache).",
        learnMore: "https://letsencrypt.org/",
      },
    ];

    // robots.txt + sitemap
    let robots = {
      found: false,
      disallowAll: false,
      sitemaps: [] as string[],
      raw: undefined as string | undefined,
    };
    try {
      const r = await fetchWithTimeout(origin + "/robots.txt", {}, 6000);
      if (r.ok) {
        const text = await r.text();
        robots = {
          found: true,
          raw: text.slice(0, 4000),
          sitemaps: [...text.matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map((m) => m[1]),
          disallowAll: /^\s*User-agent:\s*\*[\s\S]*?^\s*Disallow:\s*\/\s*$/im.test(text),
        };
      }
    } catch {
      /* ignore */
    }

    let sitemap = { found: false, urls: 0, url: undefined as string | undefined };
    const sitemapCandidates = [...robots.sitemaps, origin + "/sitemap.xml"];
    for (const candidate of sitemapCandidates) {
      try {
        const r = await fetchWithTimeout(candidate, {}, 6000);
        if (r.ok) {
          const text = await r.text();
          const urlCount = (text.match(/<loc>/gi) || []).length;
          sitemap = { found: true, urls: urlCount, url: candidate };
          break;
        }
      } catch {
        /* ignore */
      }
    }

    if (!robots.found) warnings.push("No robots.txt found.");
    if (robots.disallowAll) warnings.push("robots.txt disallows all crawlers.");
    if (!sitemap.found) warnings.push("No sitemap.xml discovered.");

    // Scores
    const seoPassed = seoChecks.filter((c) => c.ok).length;
    const secPassed = securityHeaders.filter((c) => c.ok).length;
    const kb = Math.round(new Blob([html]).size / 1024);
    const perfChecks: SeoCheck[] = [
      {
        key: "ttfb",
        label: "Fast TTFB (< 300ms)",
        ok: ttfb < 300,
        value: `${ttfb}ms`,
        advice: ttfb >= 300 ? `Server-Response ist mit ${ttfb}ms zu langsam.` : undefined,
        howToFix:
          ttfb >= 300
            ? "Aktiviere Edge-/CDN-Caching, optimiere Datenbank-Queries, reduziere Server-seitige Berechnungen oder nutze Static-Site-Generation (SSG/ISR)."
            : undefined,
        location: "Server/CDN-Konfiguration, Datenbank, API-Endpunkte oder Build-Prozess.",
        learnMore: "https://web.dev/ttfb/",
      },
      {
        key: "html-size",
        label: "HTML payload < 300 KB",
        ok: kb < 300,
        value: `${kb} KB`,
        advice: kb >= 300 ? `HTML ist ${kb} KB groß.` : undefined,
        howToFix:
          kb >= 300
            ? "Reduziere Inline-Styles und -JSON, entferne ungenutztes Markup, lade untere Sections asynchron nach und verwende Komponenten-Splitting."
            : undefined,
        location: "Template / Seiten-Komponente (page.tsx, App.vue, index.html).",
        learnMore: "https://web.dev/optimize-lcp/",
      },
      {
        key: "scripts",
        label: "≤ 20 Scripts",
        ok: scriptSrcs.length <= 20,
        value: `${scriptSrcs.length} scripts`,
        advice: scriptSrcs.length > 20 ? `Zu viele Script-Tags (${scriptSrcs.length}).` : undefined,
        howToFix:
          scriptSrcs.length > 20
            ? "Bündle Third-Party-Skripte, lade Analytics/Ads lazy oder nach Interaktion und entferne ungenutzte Tags."
            : undefined,
        location: "HTML <head>/<body>, Tag-Manager (GTM) oder Template-Imports.",
        learnMore: "https://web.dev/efficiently-load-third-party-javascript/",
      },
      {
        key: "stylesheets",
        label: "≤ 6 Stylesheets",
        ok: styleHrefs.length <= 6,
        value: `${styleHrefs.length} stylesheets`,
        advice: styleHrefs.length > 6 ? `Zu viele CSS-Dateien (${styleHrefs.length}).` : undefined,
        howToFix:
          styleHrefs.length > 6
            ? "Bündle CSS-Dateien zu einer Datei oder inline critical CSS. Nutze Tailwind/Utility-First, um separate Stylesheets zu reduzieren."
            : undefined,
        location: "Build-Tool (Vite, Webpack, PostCSS) oder Theme-Assets.",
        learnMore: "https://web.dev/defer-non-critical-css/",
      },
      {
        key: "images",
        label: "≤ 40 Bilder",
        ok: imgSrcs.length <= 40,
        value: `${imgSrcs.length} images`,
        advice: imgSrcs.length > 40 ? `Viele Bilder (${imgSrcs.length}).` : undefined,
        howToFix:
          imgSrcs.length > 40
            ? 'Nutze lazy-loading (loading="lazy"), moderne Formate (AVIF/WebP), responsive srcset und Bild-CDNs.'
            : undefined,
        location: "Template / CMS-Medienbibliothek / Komponenten.",
        learnMore: "https://web.dev/optimize-lcp/#optimize-images",
      },
      {
        key: "compression",
        label: "Kompression (gzip/br)",
        ok: /gzip|br|deflate|zstd/i.test(headers["content-encoding"] ?? ""),
        value: headers["content-encoding"] ?? "keine",
        advice: !/gzip|br|deflate|zstd/i.test(headers["content-encoding"] ?? "")
          ? "Keine Kompression aktiv."
          : undefined,
        howToFix: !/gzip|br|deflate|zstd/i.test(headers["content-encoding"] ?? "")
          ? "Aktiviere Brotli oder gzip auf dem Webserver oder CDN. Vercel/Netlify/CDN machen das meist automatisch; bei NGINX: gzip on / brotli module."
          : undefined,
        location: "Webserver/CDN-Konfiguration.",
        learnMore: "https://web.dev/optimize-encoding-and-transfer/",
      },
      {
        key: "http2",
        label: "HTTP/2 oder höher",
        ok:
          /h2|h3|http\/2|http\/3/i.test(
            (headers["alt-svc"] ?? "") + " " + (headers["x-protocol"] ?? ""),
          ) || !!headers["x-http2-stream-id"],
        value: headers["alt-svc"] ? "verfügbar" : "unbekannt",
        advice: "HTTP/2 oder HTTP/3 verbessert Multiplexing und Ladezeiten.",
        howToFix:
          "Nutze ein modernes CDN oder Hosting, das HTTP/2 bzw. HTTP/3 automatisch bereitstellt (Cloudflare, Fastly, Vercel, Netlify).",
        location: "Hosting/CDN-Einstellungen.",
        learnMore: "https://web.dev/performance-http2/",
      },
      {
        key: "cache",
        label: "Cache-Control Header",
        ok: !!headers["cache-control"] && !/no-store/i.test(headers["cache-control"]),
        value: headers["cache-control"] ?? "—",
        advice: !headers["cache-control"]
          ? "Kein Cache-Control gesetzt."
          : /no-store/i.test(headers["cache-control"] ?? "")
            ? "no-store verhindert jegliches Caching."
            : undefined,
        howToFix: !headers["cache-control"]
          ? "Setze Cache-Control: public, max-age=3600 für statische Assets und längere Zeiten für versionierte Dateien."
          : /no-store/i.test(headers["cache-control"] ?? "")
            ? "Entferne no-store, falls nicht zwingend notwendig, oder setze sensible Ressourcen auf private, no-cache."
            : undefined,
        location: "Webserver/CDN-Konfiguration oder Framework-Response-Header.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control",
      },
    ];
    const perfPassed = perfChecks.filter((c) => c.ok).length;
    const perfScore = scoreFromChecks(perfPassed, perfChecks.length);

    // Compliance checks (DSGVO / TDDDG / BITV 2.0)
    const techNames = new Set(tech.map((t) => t.name));
    const techCategories = new Set(tech.map((t) => t.category));
    const hasConsentTool = techCategories.has("privacy");
    const hasUsServices =
      techNames.has("Google Analytics") ||
      techNames.has("Meta Pixel (Facebook)") ||
      techNames.has("Google Ads") ||
      techNames.has("DoubleClick") ||
      techNames.has("TikTok Pixel") ||
      techNames.has("LinkedIn Insight") ||
      techNames.has("Pinterest Tag") ||
      techNames.has("X (Twitter) Pixel") ||
      techNames.has("Snap Pixel") ||
      techNames.has("Reddit Pixel") ||
      techNames.has("Microsoft Clarity") ||
      techNames.has("Hotjar") ||
      techNames.has("FullStory") ||
      techNames.has("LogRocket");
    const hasGoogleFonts = techNames.has("Google Fonts");
    const hasYouTube = techNames.has("YouTube Embed");
    const hasForm = /<form\b/i.test(html);
    const hasImprint = /href=["'][^"']*\/(impressum|imprint)["']/i.test(html);
    const hasPrivacy =
      /href=["'][^"']*\/(datenschutz|privacy|datenschutzerklaerung|datenschutzerklärung)["']/i.test(
        html,
      );
    const youtubeNoCookie = hasYouTube && !/youtube\.com\/embed(?!-nocookie)/i.test(html);
    const skipLink =
      /href=["']#(main|content|hauptinhalt)["']/i.test(html) ||
      /<a[^>]+class=["'][^"']*(skip|sprung)[^"']*["']/i.test(html);
    const formInputs = html.match(/<(?:input|select|textarea)\b[^>]*>/gi) || [];
    const labeledInputs = formInputs.filter((tag) => {
      const id = tag.match(/\bid=["']([^"']+)["']/i)?.[1];
      return id && new RegExp(`<label[^>]+for=["']${id}["']`, "i").test(html);
    }).length;
    const formLabelsOk =
      !hasForm || formInputs.length === 0 || labeledInputs / formInputs.length >= 0.7;
    const linkTags = [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)];
    const emptyLinks = linkTags.filter((m) => {
      const inner = m[1].replace(/<[^>]+>/g, "").trim();
      const hasAria = /aria-label=["'][^"']+["']/i.test(m[0]);
      const hasTitle = /title=["'][^"']+["']/i.test(m[0]);
      return inner.length === 0 && !hasAria && !hasTitle;
    }).length;
    const ariaLinksOk = emptyLinks === 0;
    const h2WithoutH1 = h1s.length === 0 && h2Count > 0;
    const h3WithoutH2 = h2Count === 0 && h3Count > 0;
    const headingHierarchyOk = !h2WithoutH1 && !h3WithoutH2;

    const complianceChecks: SeoCheck[] = [
      {
        key: "cookie-consent",
        label: "Cookie-Consent-Tool erkannt (DSGVO/TDDDG)",
        ok: hasConsentTool,
        value: hasConsentTool ? "ja" : "nein",
        advice: !hasConsentTool ? "Kein Cookie-Consent-Manager gefunden." : undefined,
        howToFix: !hasConsentTool
          ? "Integriere ein Consent-Tool (z. B. Usercentrics, Cookiebot, CookieYes, Osano) und blocke Marketing/Analytics-Skripte vor dem Einverständnis."
          : undefined,
        location: "Wird meist als Script im <head> eingebunden; Konfiguration im Tool-Dashboard.",
        learnMore: "https://www.gesetze-im-internet.de/ttdsg/__25.html",
      },
      {
        key: "legal-pages",
        label: "Impressum & Datenschutz verlinkt",
        ok: hasImprint && hasPrivacy,
        value:
          `${hasImprint ? "Impressum" : ""}${hasImprint && hasPrivacy ? " + " : ""}${hasPrivacy ? "Datenschutz" : ""}` ||
          "—",
        advice: !(hasImprint && hasPrivacy)
          ? "Pflichtseiten fehlen oder sind nicht verlinkt."
          : undefined,
        howToFix: !(hasImprint && hasPrivacy)
          ? "Erstelle und verlinke /impressum und /datenschutz im Footer oder Hauptmenü."
          : undefined,
        location: "Footer / Menü / CMS-Seiten.",
        learnMore: "https://www.gesetze-im-internet.de/tmg/",
      },
      {
        key: "google-fonts-local",
        label: "Google Fonts nicht extern eingebunden",
        ok: !hasGoogleFonts,
        value: hasGoogleFonts ? "extern erkannt" : "keine",
        advice: hasGoogleFonts
          ? "Externe Google Fonts übertragen IP-Adressen an Google (DSGVO-Relevanz)."
          : undefined,
        howToFix: hasGoogleFonts
          ? "Lade Google Fonts selbst gehostet (z. B. über Fontsource oder lokale Dateien) oder nutze Bunny Fonts."
          : undefined,
        location: "<head>-Verlinkung oder CSS-Import; ersetze durch lokale Assets.",
        learnMore: "https://rewis.io/urteile/urteil/lhm-20-01-2022-3-o-1749320/",
      },
      {
        key: "youtube-nocookie",
        label: "YouTube-Einbettungen mit nocookie",
        ok: !hasYouTube || youtubeNoCookie,
        value: hasYouTube ? (youtubeNoCookie ? "nocookie" : "Standard-Einbettung") : "kein YouTube",
        advice:
          hasYouTube && !youtubeNoCookie
            ? "Standard-YouTube-Einbettung setzt Tracking-Cookies."
            : undefined,
        howToFix:
          hasYouTube && !youtubeNoCookie
            ? "Ersetze youtube.com/embed/ durch youtube-nocookie.com/embed/ oder nutze einen Datenschutz-Videoplayer mit Zwei-Klick-Lösung."
            : undefined,
        location: "HTML-Einbettungscode in Template/Inhalt.",
        learnMore: "https://www.gesetze-im-internet.de/ttdsg/__25.html",
      },
      {
        key: "us-services",
        label: "Datenschutzkritische US-Dienste dokumentiert",
        ok: !hasUsServices || hasConsentTool,
        value: hasUsServices
          ? hasConsentTool
            ? "vorhanden, Consent aktiv"
            : "ohne Consent erkannt"
          : "keine",
        advice:
          hasUsServices && !hasConsentTool
            ? "US-Dienste übertragen personenbezogene Daten in Drittstaaten."
            : undefined,
        howToFix:
          hasUsServices && !hasConsentTool
            ? "Füge einen Consent-Manager hinzu oder dokumentiere die Drittstaaten-Transfers in der Datenschutzerklärung (Art. 13/14 DSGVO) und prüfe TCF/Standard Contractual Clauses."
            : undefined,
        location: "Datenschutzerklärung und Consent-Tool-Konfiguration.",
        learnMore: "https://gdpr-info.eu/art-13-gdpr/",
      },
      {
        key: "skip-link",
        label: "Skip-Link für Screenreader (BITV 2.0)",
        ok: !!skipLink,
        value: skipLink ? "vorhanden" : "fehlt",
        advice: !skipLink ? "Kein Skip-Link zum Hauptinhalt gefunden." : undefined,
        howToFix: !skipLink
          ? 'Füge als erstes fokussierbares Element einen Link an: <a href="#main" class="skip-link">Zum Hauptinhalt springen</a>.'
          : undefined,
        location: "Direkt nach <body> im Root-Template.",
        learnMore: "https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html",
      },
      {
        key: "form-labels",
        label: "Formularfelder beschriftet",
        ok: formLabelsOk,
        value: hasForm ? `${labeledInputs}/${formInputs.length} Felder` : "kein Formular",
        advice:
          hasForm && !formLabelsOk ? "Viele Formularfelder ohne zugeordnetes <label>." : undefined,
        howToFix:
          hasForm && !formLabelsOk
            ? 'Verbinde jedes <input>/<select>/<textarea> über id + <label for="id"> oder aria-label/aria-labelledby.'
            : undefined,
        location: "Formular-Templates oder CMS-Formulareditor.",
        learnMore: "https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html",
      },
      {
        key: "aria-links",
        label: "Leere Links/Buttons mit aria-label",
        ok: ariaLinksOk,
        value: `${emptyLinks} leere Links`,
        advice: !ariaLinksOk
          ? "Links oder Buttons ohne Text und ohne aria-label gefunden."
          : undefined,
        howToFix: !ariaLinksOk
          ? "Füge bei Icon-Links/Buttons ein aria-label oder einen visuell verborgenen Text hinzu."
          : undefined,
        location: "Komponenten / Template / Theme.",
        learnMore: "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html",
      },
      {
        key: "heading-hierarchy",
        label: "Logische Überschriften-Hierarchie",
        ok: headingHierarchyOk,
        value: `H1 ${h1s.length} · H2 ${h2Count} · H3 ${h3Count}`,
        advice: !headingHierarchyOk
          ? "Überschriften-Hierarchie ist unlogisch (H2 ohne H1 oder H3 ohne H2)."
          : undefined,
        howToFix: !headingHierarchyOk
          ? "Stelle sicher, dass H1 vor H2 und H2 vor H3 kommt; überspringe keine Ebenen."
          : undefined,
        location: "Seiten-Template und Editor-Inhalt.",
        learnMore: "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html",
      },
      {
        key: "odr-link",
        label: "OS-Plattform / ODR-Link (Webshop)",
        ok: /ec\.europa\.eu\/(consumers\/)?odr/i.test(html),
        value: /ec\.europa\.eu\/(consumers\/)?odr/i.test(html) ? "verlinkt" : "fehlt",
        advice: !/ec\.europa\.eu\/(consumers\/)?odr/i.test(html)
          ? "Pflicht-Link zur EU-Online-Streitbeilegungsplattform fehlt."
          : undefined,
        howToFix: !/ec\.europa\.eu\/(consumers\/)?odr/i.test(html)
          ? 'Füge im Footer oder Bestellprozess einen Link ein: <a href="https://ec.europa.eu/consumers/odr">Online-Streitbeilegung</a>.'
          : undefined,
        location: "Footer, AGB oder Checkout-Seite.",
        learnMore: "https://www.gesetze-im-internet.de/vschg/",
      },
      {
        key: "shop-terms",
        label: "AGB, Widerruf, Versand & Zahlung verlinkt (Webshop)",
        ok:
          /href=["'][^"']*\/(agb|terms|allgemeine-geschaeftsbedingungen)["']/i.test(html) &&
          /href=["'][^"']*\/(widerruf|widerrufsbelehrung|cancellation|returns)["']/i.test(html) &&
          (/href=["'][^"']*\/(versand|lieferung|shipping|delivery|zahlung|payment|zahlungsarten)["']/i.test(
            html,
          ) ||
            /(Versand|Lieferung|Zahlung|Payment|Delivery)/i.test(html)),
        value: "Shop-Seiten",
        advice: !(
          /href=["'][^"']*\/(agb|terms|allgemeine-geschaeftsbedingungen)["']/i.test(html) &&
          /href=["'][^"']*\/(widerruf|widerrufsbelehrung|cancellation|returns)["']/i.test(html)
        )
          ? "AGB und/oder Widerrufsbelehrung nicht verlinkt."
          : undefined,
        howToFix: !(
          /href=["'][^"']*\/(agb|terms|allgemeine-geschaeftsbedingungen)["']/i.test(html) &&
          /href=["'][^"']*\/(widerruf|widerrufsbelehrung|cancellation|returns)["']/i.test(html)
        )
          ? "Verlinke im Footer und Checkout auf AGB, Widerrufsbelehrung, Versand-/Lieferbedingungen und Zahlungsarten."
          : undefined,
        location: "Footer, Checkout-Seite, CMS-Seiten.",
        learnMore: "https://www.gesetze-im-internet.de/bgb/__312g.html",
      },
      {
        key: "cancellation-access",
        label: "Storno-/Widerrufs-Zugang erreichbar (Webshop)",
        ok:
          /href=["'][^"']*\/(konto|account|mein-konto|meine-bestellungen|orders|order-history)["']/i.test(
            html,
          ) || /(stornieren|widerrufen|bestellung.*abbr|cancel.*order|return.*order)/i.test(html),
        value: "Kundenbereich",
        advice: !(
          /href=["'][^"']*\/(konto|account|mein-konto|meine-bestellungen|orders|order-history)["']/i.test(
            html,
          ) || /(stornieren|widerrufen|bestellung.*abbr|cancel.*order|return.*order)/i.test(html)
        )
          ? "Kein erkennbarer Zugang für Stornierung/Widerruf."
          : undefined,
        howToFix: !(
          /href=["'][^"']*\/(konto|account|mein-konto|meine-bestellungen|orders|order-history)["']/i.test(
            html,
          ) || /(stornieren|widerrufen|bestellung.*abbr|cancel.*order|return.*order)/i.test(html)
        )
          ? "Biete im Kundenkonto oder Footer einen deutlichen Link/Button zur Bestell-Stornierung/Widerruf an."
          : undefined,
        location: "Kundenkonto-Template, Footer oder Bestellbestätigungs-E-Mail.",
        learnMore: "https://www.gesetze-im-internet.de/bgb/__355.html",
      },
      {
        key: "button-solution",
        label: "Bestellbutton eindeutig beschriftet (Button-Lösung)",
        ok: true,
        value: "manuell prüfen",
        advice:
          "Im Bestellprozess muss der Zahlungs-/Bestellbutton eindeutig erkennbar sein und den Preis zeigen (Button-Lösung).",
        howToFix:
          'Verwende im Checkout einen Button mit klarer Beschriftung wie "zahlungspflichtig bestellen" und zeige Endpreis inkl. Versand direkt davor.',
        location: "Checkout-/Warenkorb-Template.",
        learnMore: "https://www.gesetze-im-internet.de/bgb/__312g.html",
      },
    ];
    const compliancePassed = complianceChecks.filter((c) => c.ok).length;
    const complianceScore = scoreFromChecks(compliancePassed, complianceChecks.length);

    const seoScore = scoreFromChecks(seoPassed, seoChecks.length);
    const secScore = scoreFromChecks(secPassed, securityHeaders.length);
    const overall = Math.round((seoScore + secScore + perfScore + complianceScore) / 4);

    const architecture = buildArchitecture(tech, headers, html);
    const socialHowTo = buildSocialHowTo(socials, tech);

    const hostname = new URL(finalUrl).hostname;
    const [impressumResult, hostingDetails, externalApis] = await Promise.all([
      fetchImpressumHtml(finalUrl, html),
      lookupHostingDetails(hostname),
      extractExternalApiDomains(html, finalUrl),
    ]);
    const operator = impressumResult.html
      ? parseOperator(impressumResult.html, impressumResult.url)
      : {
          name: null,
          address: null,
          email: null,
          phone: null,
          sourceUrl: null,
        };

    const backendHosting: AnalyzeResult["backendHosting"] = [];
    const uniqueApiDomains = [
      ...new Set(
        externalApis
          .map((entry) => {
            try {
              return new URL(entry.startsWith("http") ? entry : `https://${entry}`).hostname;
            } catch {
              return "";
            }
          })
          .filter(Boolean),
      ),
    ].slice(0, 5);
    if (uniqueApiDomains.length > 0) {
      const apiHostingResults = await Promise.all(
        uniqueApiDomains.map((domain) => lookupApiHosting(domain)),
      );
      backendHosting.push(...apiHostingResults);
    }

    return {
      url: startUrl,
      finalUrl,
      status: response.status,
      timings: {
        dns: 0,
        total,
        ttfb,
        downloadKb: Math.round(new Blob([html]).size / 102.4) / 10,
      },
      score: {
        seo: seoScore,
        security: secScore,
        performance: perfScore,
        compliance: complianceScore,
        overall,
      },
      meta: {
        title,
        description,
        canonical,
        lang,
        favicon,
        ogImage,
        ogTitle,
        ogDescription,
        twitterCard,
        viewport,
        charset,
        generator,
        themeColor,
        author,
        robotsMeta,
      },
      seoChecks,
      perfChecks,
      complianceChecks,
      headers,
      securityHeaders,
      cookies,
      robots,
      sitemap,
      tech,
      links: {
        internal,
        external,
        scripts: scriptSrcs.length,
        stylesheets: styleHrefs.length,
        images: imgSrcs.length,
      },
      headings: { h1: h1s.length, h2: h2Count, h3: h3Count, h1Text: h1s.slice(0, 5) },
      socials,
      socialHowTo,
      architecture,
      operator,
      hostingDetails,
      externalApis,
      backendHosting,
      errors,
      warnings,
    };
  });
