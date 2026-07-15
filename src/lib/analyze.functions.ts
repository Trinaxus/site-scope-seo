import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import dns from "node:dns/promises";
import https from "node:https";
import http2 from "node:http2";

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
  findings?: Finding[];
}

export interface Finding {
  type: "positive" | "negative" | "info";
  message: string;
  snippet?: string;
  howToFix?: string;
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
    mobile: number;
    business: number;
    wordpress: number;
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
  mobileChecks: SeoCheck[];
  businessChecks: SeoCheck[];
  wpChecks: SeoCheck[];
  wpRestApiStatus?: string;
  cookieBanner: {
    detected: boolean;
    tool: string | null;
    needsBanner: boolean;
    trackingServices: string[];
    nonEssentialCookies: boolean;
    recommendation: string;
  };
  headers: Record<string, string>;
  securityHeaders: SecurityHeader[];
  cookies: {
    name: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: string | null;
    category: "necessary" | "analytics" | "marketing" | "third-party" | "unknown";
  }[];
  robots: { found: boolean; disallowAll: boolean; sitemaps: string[]; raw?: string };
  sitemap: { found: boolean; urls: number; url?: string };
  tech: TechHit[];
  languageShares: Record<string, number>;
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
    databases: string[];
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
  http: {
    version: string | null;
    supportsHttp2: boolean;
    supportsHttp3: boolean;
    altSvc: string | null;
    server: string | null;
  };
  errors: string[];
  warnings: string[];
}

const InputSchema = z.object({ url: z.string().min(3) });

async function checkHttp2Directly(
  url: string,
): Promise<{ supportsHttp2: boolean; altSvc: string | null }> {
  const target = new URL(url);
  if (target.protocol !== "https:") return { supportsHttp2: false, altSvc: null };
  return new Promise((resolve) => {
    let resolved = false;
    const client = http2.connect(`https://${target.hostname}`, {
      servername: target.hostname,
    });
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        client.destroy();
        resolve({ supportsHttp2: false, altSvc: null });
      }
    }, 10000);

    client.on("connect", () => {
      if (resolved) return;
      try {
        const req = client.request({
          ":method": "HEAD",
          ":path": target.pathname + target.search,
          "user-agent":
            "Mozilla/5.0 (compatible; SiteScopeBot/1.0; +https://sitescope.app) Chrome/120",
        });
        req.on("response", (headers) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            const altSvc = headers["alt-svc"] || null;
            const alt =
              typeof altSvc === "string" ? altSvc : Array.isArray(altSvc) ? altSvc[0] : null;
            client.close();
            resolve({ supportsHttp2: true, altSvc: alt });
          }
        });
        req.on("error", () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            client.destroy();
            resolve({ supportsHttp2: true, altSvc: null });
          }
        });
        req.end();
      } catch {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          client.destroy();
          resolve({ supportsHttp2: true, altSvc: null });
        }
      }
    });

    client.on("error", () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        client.destroy();
        resolve({ supportsHttp2: false, altSvc: null });
      }
    });
  });
}

async function checkHttpProtocols(url: string, warnings: string[]): Promise<AnalyzeResult["http"]> {
  const target = new URL(url);
  const defaultResult: AnalyzeResult["http"] = {
    version: null,
    supportsHttp2: false,
    supportsHttp3: false,
    altSvc: null,
    server: null,
  };

  if (target.protocol !== "https:") return defaultResult;

  const http2Promise = checkHttp2Directly(url);

  type HttpCheckResult = AnalyzeResult["http"] & { error?: string };

  const requestOnce = (
    alpn: string[] | undefined,
    method: "GET" | "HEAD" = "GET",
  ): Promise<HttpCheckResult> => {
    return new Promise<HttpCheckResult>((resolve) => {
      const options: https.RequestOptions & { ALPNProtocols?: string[] } = {
        hostname: target.hostname,
        servername: target.hostname,
        port: 443,
        path: target.pathname + target.search,
        method,
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; SiteScopeBot/1.0; +https://sitescope.app) Chrome/120",
          accept: "*/*",
        },
        ALPNProtocols: alpn,
        timeout: 15000,
      };
      const req = https.request(options, (res) => {
        res.resume(); // consume body so connection can close cleanly
        const altSvc = res.headers["alt-svc"] || null;
        const serverHeader = res.headers["server"];
        const server =
          typeof serverHeader === "string"
            ? serverHeader
            : Array.isArray(serverHeader)
              ? serverHeader[0]
              : null;
        const version = res.httpVersion || null;
        console.log(
          `[checkHttpProtocols] ${url} -> status=${res.statusCode} version=${version} alt-svc=${altSvc} server=${server}`,
        );
        resolve({
          version,
          supportsHttp2: version === "2.0",
          supportsHttp3: typeof altSvc === "string" && altSvc.includes("h3="),
          altSvc,
          server,
        });
      });

      req.on("error", (err) => {
        console.log(
          `[checkHttpProtocols] ERROR ${url} ALPN=${alpn?.join(",") ?? "none"}: ${err.message}`,
        );
        resolve({ ...defaultResult, error: err.message });
      });
      req.on("timeout", () => {
        console.log(`[checkHttpProtocols] TIMEOUT ${url}`);
        req.destroy();
        resolve({ ...defaultResult, error: "timeout" });
      });
      req.end();
    });
  };

  const httpsPromise = new Promise<AnalyzeResult["http"]>((resolve) => {
    requestOnce(["h2", "http/1.1"]).then((first: HttpCheckResult) => {
      if (first.error) {
        // Retry with HTTP/1.1 only and HEAD request to avoid hanging sockets.
        requestOnce(["http/1.1"], "HEAD").then((second: HttpCheckResult) => {
          if (second.error) {
            warnings.push(`HTTP-Protokoll-Check fehlgeschlagen: ${first.error}`);
            resolve(defaultResult);
          } else {
            resolve(second);
          }
        });
      } else {
        resolve(first);
      }
    });
  });

  const [httpsResult, http2Result] = await Promise.all([httpsPromise, http2Promise]);
  console.log(
    `[checkHttpProtocols] ${url} -> http2Direct=${http2Result.supportsHttp2} altSvcHttp2=${http2Result.altSvc}`,
  );
  const result = httpsResult;
  if (http2Result.supportsHttp2) {
    result.supportsHttp2 = true;
    result.version = result.version ?? "2.0";
  }
  // Prefer alt-svc from the real HTTP/2 response if available.
  const altSvc = http2Result.altSvc ?? result.altSvc;
  if (altSvc) {
    result.altSvc = altSvc;
    result.supportsHttp3 = /h3(?:-[0-9]+)?=/i.test(altSvc) || altSvc.toLowerCase().includes("h3=");
  }
  return result;
}

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

function scoreFromChecks(passed: number, total: number): number {
  if (!total) return 0;
  return Math.round((passed / total) * 100);
}

function decodeHtmlEntities(input: string | null | undefined): string | null {
  if (!input) return null;
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Fingerprints - pattern-based detection
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
  {
    name: "JavaScript",
    category: "language",
    html: [/\.js(\?|"|')/, /<script\b/i],
  },
  {
    name: "HTML",
    category: "language",
    html: [/<!DOCTYPE html|<html\b/i],
  },
  {
    name: "CSS",
    category: "language",
    html: [/<style\b|\.css(\?|"|')/i],
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
  { name: "Cookiebot", category: "privacy", html: [/consent\.cookiebot\.com|cookiebot/] },
  { name: "Usercentrics", category: "privacy", html: [/usercentrics\.eu|app\.usercentrics/] },
  { name: "Iubenda", category: "privacy", html: [/iubenda\.com|iubenda-cs/] },
  { name: "CookieYes", category: "privacy", html: [/cookieyes\.com|cky-consent|cky-banner/] },
  { name: "Osano", category: "privacy", html: [/osano\.com|osano-compliance/] },
  { name: "Termly", category: "privacy", html: [/termly\.io|termly-consent/] },
  { name: "Traffict", category: "privacy", html: [/traffict\.digital|traffict-consent/] },
  { name: "Borlabs Cookie", category: "privacy", html: [/borlabs\.io|borlabs-cookie/] },
  { name: "Klaro", category: "privacy", html: [/klaro\.js|klaro-config/] },
  { name: "Quantcast Choice", category: "privacy", html: [/quantcast\.mgr|quantcast\.choice/] },
  { name: "TrustArc", category: "privacy", html: [/trustarc\.com|truste\.com/] },
  { name: "Sourcepoint", category: "privacy", html: [/sourcepoint|cmp\.sourcepoint/] },
  { name: "Didomi", category: "privacy", html: [/didomi\.io|didomi-consent/] },
  { name: "Axeptio", category: "privacy", html: [/axeptio\.io|axeptio/] },
  { name: "Piwik PRO", category: "privacy", html: [/piwik\.pro\/consent|ppms_cm/] },
  { name: " consentmanager", category: "privacy", html: [/consentmanager\.net|cmp-consent/] },

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

function estimateLanguageShares(html: string): Record<string, number> {
  const scriptTags = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  const styleTags = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];

  const inlineJs = scriptTags.reduce((sum, m) => sum + m[1].length, 0);
  const inlineCss = styleTags.reduce((sum, m) => sum + m[1].length, 0);

  const tagTokens = html.match(/<[^>]+>/g) || [];
  const htmlMarkup = tagTokens.reduce((sum, t) => sum + t.length, 0);

  const total = Math.max(1, html.length);
  const other = Math.max(0, total - htmlMarkup - inlineJs - inlineCss);

  const raw = {
    HTML: htmlMarkup,
    CSS: inlineCss,
    JavaScript: inlineJs,
    Text: other,
  };

  const totalWeighted = Object.values(raw).reduce((a, b) => a + b, 0);
  const shares: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    shares[k] = totalWeighted > 0 ? Math.round((v / totalWeighted) * 100) : 0;
  }

  // Rundungsfehler ausgleichen
  const sum = Object.values(shares).reduce((a, b) => a + b, 0);
  if (sum !== 100 && sum > 0) {
    const maxKey = Object.entries(shares).sort((a, b) => b[1] - a[1])[0][0];
    shares[maxKey] += 100 - sum;
  }
  return shares;
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

function inferDatabase(html: string, techNames: Set<string>): string[] {
  const dbs: string[] = [];
  if (techNames.has("WordPress") || /wp-content|wp-includes/i.test(html)) dbs.push("MySQL / MariaDB (typisch für WordPress)");
  if (/\bmysql\b|\bmariadb\b/i.test(html)) dbs.push("MySQL / MariaDB");
  if (/\bpostgres(ql)?\b/i.test(html)) dbs.push("PostgreSQL");
  if (/\bmongodb\b/i.test(html)) dbs.push("MongoDB");
  if (/\bsqlite\b/i.test(html)) dbs.push("SQLite");
  if (/\bfirebase(io)?\b/i.test(html)) dbs.push("Firebase (NoSQL)");
  if (/\bsupabase\b/i.test(html)) dbs.push("Supabase (PostgreSQL)");
  return [...new Set(dbs)];
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
  let backend = inCategory("language");
  const server = inCategory("webserver");
  const hosting = inCategory("hosting", "cdn");
  const cms = inCategory("cms", "ecommerce");
  const languages = inCategory("language");
  const apiRoutes = extractApiRoutes(html);

  const serverHeader = headers["server"];
  if (serverHeader && !server.length) {
    server.push(serverHeader.split("/")[0]);
  }

  // PHP erkennen, auch wenn Header nicht gesetzt sind
  if (!names.has("PHP")) {
    const hasPhp =
      /\.php(\?|"|')/i.test(html) ||
      /wp-content|wp-includes|wp-json/i.test(html) ||
      /\bphp\b/i.test(headers["x-powered-by"] ?? "");
    if (hasPhp) {
      backend.push("PHP");
      names.add("PHP");
    }
  }

  // JSON als statische Datenquelle erkennen
  const jsonDataSources = [...html.matchAll(/["']([^"']+\.json(?:\?[^"']*)?)["']/gi)].map(
    (m) => m[1],
  );
  const uniqueJsonSources = [...new Set(jsonDataSources)];

  const databases = inferDatabase(html, names);

  const parts: string[] = [];
  if (cms.length) parts.push(`CMS/Shop-System: ${cms.join(", ")}`);
  if (frontend.length) parts.push(`Frontend: ${frontend.join(", ")}`);
  if (backend.length || languages.length)
    parts.push(`Backend/Sprache: ${[...new Set([...backend, ...languages])].join(", ")}`);
  if (databases.length) parts.push(`Datenbank: ${databases.join(", ")}`);
  if (uniqueJsonSources.length)
    parts.push(`${uniqueJsonSources.length} JSON-Datenquelle(n) erkannt`);
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
    databases,
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

    let http = await checkHttpProtocols(finalUrl, warnings);
    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

    // Fallback: if ALPN check did not detect a version but alt-svc advertises h2/h3,
    // use the header signal so we don't show "unknown" on HTTP/2-only hosts.
    if (!http.version && headers["alt-svc"]) {
      const alt = headers["alt-svc"];
      http = {
        ...http,
        altSvc: alt,
        supportsHttp3: /h3=/i.test(alt),
        supportsHttp2: /h2=/i.test(alt) || /h2/i.test(alt),
        version: /h3=/i.test(alt) ? "2.0" : /h2/i.test(alt) ? "2.0" : http.version,
      };
    }

    // Final fallback: if Node https returned HTTP/1.1 but alt-svc offers h3, mark h3 available.
    if (http.version === "1.1" && headers["alt-svc"] && /h3=/i.test(headers["alt-svc"])) {
      http = { ...http, supportsHttp3: true };
    }

    // Cookies
    const setCookies: string[] = [];
    const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] })
      .getSetCookie;
    if (typeof getSetCookie === "function") setCookies.push(...getSetCookie.call(response.headers));
    else if (headers["set-cookie"]) setCookies.push(headers["set-cookie"]);
    function categorizeCookie(name: string): AnalyzeResult["cookies"][number]["category"] {
      const n = name.toLowerCase();
      const necessary = [
        "session",
        "sess",
        "csrf",
        "xsrf",
        "token",
        "auth",
        "login",
        "sid",
        "phpsessid",
        "jsessionid",
        "asp.net_sessionid",
        "laravel_session",
        "wordpress_logged_in",
        "wp-settings",
        "woocommerce_cart",
        "woocommerce_sessions",
        "cart",
        "basket",
        "consent",
        "cookieconsent",
        "cookieyes",
        "cky",
        "usprivacy",
        "optanon",
        "eupubconsent",
        "pubconsent",
      ];
      const analytics = [
        "_ga",
        "_gid",
        "_gat",
        "_dc_gtm",
        "_gac",
        "_utm",
        "__utma",
        "__utmb",
        "__utmc",
        "__utmz",
        "__utmv",
        "_pk_id",
        "_pk_ses",
        "_hj",
        "hotjar",
        "_clck",
        "_clsk",
        "_fbp",
        "_sc",
        "_ss",
        "_tla",
        "_tq_id",
        "amplitude",
        "segment",
        "mp_",
        "mixpanel",
        "pendo",
        "fullstory",
        "logrocket",
        "bugsnag",
        "sentry",
      ];
      const marketing = [
        "_fbp",
        "fr",
        "tr",
        "_gcl_au",
        "_gcl_aw",
        "_gcl_dc",
        "_uetsid",
        "_uetvid",
        "_pin_",
        "_derived_epik",
        "_rdc_",
        "_scid",
        "_ssclid",
        "li_ads",
        "liap",
        "lidc",
        "bcookie",
        "bscookie",
        " personalization_id",
        "guest_id",
        "muc_ads",
        "ads",
        "doubleclick",
        "__adroll",
        "_cq_",
        "_hp2_",
        "hubspotutk",
        "hs_c2l",
        "msg_",
        "opt_",
      ];
      if (necessary.some((k) => n.includes(k))) return "necessary";
      if (analytics.some((k) => n.includes(k))) return "analytics";
      if (marketing.some((k) => n.includes(k))) return "marketing";
      if (n.includes("_") && (n.startsWith("_") || n.includes("_"))) return "third-party";
      return "unknown";
    }

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
        category: categorizeCookie(name),
      };
    });

    // Meta extraction
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = decodeHtmlEntities(titleMatch ? titleMatch[1].trim() : null);
    const description = decodeHtmlEntities(
      pickAttr(html, "meta", "name", "content") && /name=["']description["']/i.test(html)
        ? (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
            null)
        : null,
    );
    const canonical =
      html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? null;
    const lang = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? null;
    const favicon =
      html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
      null;
    const ogImage =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
    const ogTitle = decodeHtmlEntities(
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null,
    );
    const ogDescription = decodeHtmlEntities(
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
        null,
    );
    const twitterCard = decodeHtmlEntities(
      html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null,
    );
    const viewport =
      html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
    const charset = html.match(/<meta[^>]+charset=["']?([^"'\s>]+)/i)?.[1] ?? null;
    const generator = decodeHtmlEntities(
      html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null,
    );
    const themeColor =
      html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
    const author = decodeHtmlEntities(
      html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null,
    );
    const robotsMeta = decodeHtmlEntities(
      html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null,
    );

    // Headings
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
      .map((m) => decodeHtmlEntities(m[1].replace(/<[^>]+>/g, "").trim()))
      .filter(Boolean) as string[];
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
      ((): SecurityHeader => {
        const v = headers["content-security-policy"] ?? null;
        const reportOnly = headers["content-security-policy-report-only"] ?? null;
        const passed = !!(v || reportOnly);
        return {
          name: "content-security-policy",
          value: v ?? reportOnly,
          ok: passed,
          advice: passed
            ? undefined
            : "Füge eine Content-Security-Policy hinzu, um XSS zu verhindern.",
          howToFix: passed
            ? undefined
            : "Starte mit einer Report-Only Policy (Content-Security-Policy-Report-Only), logge Verstöße und verschärfe dann. Beispiel: default-src 'self'; script-src 'self'; object-src 'none'.",
          location: passed
            ? undefined
            : "Webserver/CDN-Konfiguration oder Meta-Tag im <head> (nicht empfohlen für alle Direktiven).",
          learnMore: passed
            ? undefined
            : "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy",
        };
      })(),
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
    const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
    const imgCount = imgTags.length;
    const imgWithAlt = imgTags.filter((t) => /\balt=/i.test(t)).length;
    const imgFindings: Finding[] = imgTags.slice(0, 20).map((tag) => {
      const altMatch = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
      const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
      const alt = altMatch ? altMatch[1] : undefined;
      const src = srcMatch ? srcMatch[1] : undefined;
      const snippet = tag.length > 120 ? tag.slice(0, 120) + "…" : tag;
      if (alt !== undefined) {
        return {
          type: "positive" as const,
          message: `Alt-Text: "${alt || "(leer)"}"`,
          snippet: src || snippet,
        };
      }
      return {
        type: "negative" as const,
        message: "Bild ohne alt-Attribut",
        snippet: src || snippet,
        howToFix: "Füge ein beschreibendes alt-Attribut hinzu oder alt=\"\" für Dekobilder.",
      };
    });

    const seoChecks: SeoCheck[] = [
      {
        key: "title",
        label: "Title tag",
        ok: !!title && title.length >= 10 && title.length <= 65,
        value: title ?? "-",
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
        value: description ?? "-",
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
        value: canonical ?? "-",
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
        value: viewport ?? "-",
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
        value: lang ?? "-",
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
        value: twitterCard ?? "-",
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
        value: favicon ?? "-",
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
        findings: imgFindings,
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
        ok: http.supportsHttp2 || http.supportsHttp3,
        value: http.supportsHttp3
          ? "HTTP/3 verfügbar"
          : http.supportsHttp2
            ? "HTTP/2 aktiv"
            : http.version === "1.1"
              ? "HTTP/1.1"
              : "unbekannt",
        advice: http.supportsHttp2
          ? "HTTP/2 oder HTTP/3 verbessert Multiplexing und Ladezeiten."
          : "Aktiviere HTTP/2 oder HTTP/3, um Ladezeiten zu verbessern.",
        howToFix:
          "Nutze ein modernes CDN oder Hosting, das HTTP/2 bzw. HTTP/3 automatisch bereitstellt (Cloudflare, Fastly, Vercel, Netlify).",
        location: "Hosting/CDN-Einstellungen.",
        learnMore: "https://web.dev/performance-http2/",
      },
      {
        key: "cache",
        label: "Cache-Control Header",
        ok: !!headers["cache-control"] && !/no-store/i.test(headers["cache-control"]),
        value: headers["cache-control"] ?? "-",
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
    const hasCookies = cookies.length > 0;
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
    const hasTrackingScripts =
      techCategories.has("analytics") ||
      techCategories.has("ads") ||
      techCategories.has("marketing") ||
      techCategories.has("cdp");
    const needsConsentTool = hasCookies || hasTrackingScripts || hasUsServices;
    const isEcommerceSite =
      techCategories.has("ecommerce") ||
      techNames.has("Shopify") ||
      techNames.has("WooCommerce") ||
      techNames.has("Magento") ||
      techNames.has(" Shopware") ||
      techNames.has("BigCommerce") ||
      techNames.has("PrestaShop") ||
      techNames.has("OpenCart");
    const hasGoogleFonts = techNames.has("Google Fonts");
    const hasYouTube = techNames.has("YouTube Embed");
    const hasForm = /<form\b/i.test(html);
    const hasImprint =
      /<(a|link)\b[^>]*href=["'][^"']*(impressum|imprint)[^"']*["']/i.test(html) ||
      /<a\b[^>]*>[^<]*(impressum|imprint)[^<]*<\/a>/i.test(html);
    const hasPrivacy =
      /<(a|link)\b[^>]*href=["'][^"']*(datenschutz|privacy|datenschutzerklaerung|datenschutzerklärung)[^"']*["']/i.test(
        html,
      ) ||
      /<a\b[^>]*>[^<]*(datenschutz|privacy|datenschutzerklärung|datenschutzerklaerung)[^<]*<\/a>/i.test(
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
    const emptyLinkFindings: Finding[] = [];
    const emptyLinks = linkTags.filter((m) => {
      const inner = m[1].replace(/<[^>]+>/g, "").trim();
      const hasAria = /aria-label=["'][^"']+["']/i.test(m[0]);
      const hasTitle = /title=["'][^"']+["']/i.test(m[0]);
      const isEmpty = inner.length === 0 && !hasAria && !hasTitle;
      if (isEmpty) {
        const href = m[0].match(/href\s*=\s*["']([^"']*)["']/i)?.[1] || "";
        const snippet = m[0].length > 120 ? m[0].slice(0, 120) + "…" : m[0];
        emptyLinkFindings.push({
          type: "negative",
          message: `Leerer Link${href ? ` (href: ${href})` : ""}`,
          snippet,
          howToFix: "Füge einen Link-Text, aria-label oder title hinzu.",
        });
      }
      return isEmpty;
    }).length;
    const ariaLinksOk = emptyLinks === 0;
    const h2WithoutH1 = h1s.length === 0 && h2Count > 0;
    const h3WithoutH2 = h2Count === 0 && h3Count > 0;
    const headingHierarchyOk = !h2WithoutH1 && !h3WithoutH2;

    const cookieBannerHtml =
      /class\s*=\s*["'][^"']*(cookie-banner|cookie-consent|cookie-notice|gdpr-banner|cc-banner|cookie-popup|cookie-wall|cookie-settings|privacy-banner|consent-banner)[^"']*["']/i.test(
        html,
      ) ||
      /id\s*=\s*["'][^"']*(cookie-banner|cookie-consent|cookie-notice|gdpr|cc-banner|cookie-popup|cookie-wall|cookie-settings|privacy-banner|consent-banner)[^"']*["']/i.test(
        html,
      ) ||
      /data-testid\s*=\s*["'][^"']*(cookie|consent|gdpr)[^"']*["']/i.test(html) ||
      /data-[^=\s]*\s*=\s*["'][^"']*(cmplz|borlabs|cky|cookieyes|usercentrics|onetrust|osano|iubenda|tarteaucitron|quantcast|termly|hs-banner|hubspot-cookie|cookiebot)[^"']*["']/i.test(
        html,
      ) ||
      /<script[^>]*src=["'][^"']*(complianz|borlabs|cookieyes|cookiebot|usercentrics|onetrust|osano|iubenda|tarteaucitron|quantcast|termly|hubspot-cookie|hs-banner|cmp-v2|cmplz)[^"']*/i.test(
        html,
      ) ||
      /window\.(cmplz_|borlabsCookie_|cookieyes_|Usercentrics|Onetrust|Osano|iubenda|tarteaucitron|quantcast_|ucCmp)/i.test(
        html,
      ) ||
      techCategories.has("privacy");
    const cookieBannerFixed = /position\s*:\s*fixed/i.test(html);
    const cookieBannerOk = !cookieBannerHtml || cookieBannerFixed;
    const nonEssentialCookies = cookies.some((c) =>
      ["analytics", "marketing", "third-party"].includes(c.category),
    );

    const consentToolNames = [
      { name: "CookieYes", pattern: /cookieyes|cy-consent|cky-consent/i },
      { name: "Cookiebot", pattern: /cookiebot|CookieConsent/i },
      { name: "Usercentrics", pattern: /usercentrics|uc-block/i },
      { name: "OneTrust / CookiePro", pattern: /onetrust|cookiepro|optanon/i },
      { name: "Osano", pattern: /osano|cmp-v2/i },
      { name: "iubenda", pattern: /iubenda|_iubenda/i },
      { name: "Complianz", pattern: /complianz|cmplz/i },
      { name: "Borlabs Cookie", pattern: /borlabs|borlabs-cookie/i },
      { name: "Real Cookie Banner", pattern: /real-cookie-banner/i },
      { name: "Tarte au Citron", pattern: /tarteaucitron/i },
      { name: "HubSpot Cookie Banner", pattern: /hs-banner|hubspot-cookie/i },
      { name: "Termly", pattern: /termly|termly-consent/i },
      { name: "TrustArc", pattern: /trustarc/i },
      { name: "Quantcast Choice", pattern: /quantcast|qc-cmp/i },
    ];
    const detectedTool =
      consentToolNames.find((t) => t.pattern.test(html)) ??
      consentToolNames.find((t) =>
        consentToolNames
          .flatMap((t) => [t.name.toLowerCase().replace(/\s+/g, "-")])
          .some(() => /cmplz|borlabs|cookieyes|cookiebot/i.test(html)),
      );
    const bannerToolName = detectedTool?.name ?? (hasConsentTool ? "Bekanntes Tool" : null);

    const cookieBanner = {
      detected: cookieBannerHtml,
      tool: bannerToolName,
      needsBanner: needsConsentTool,
      trackingServices: [
        ...new Set(
          tech
            .filter((t) => ["analytics", "ads", "marketing"].includes(t.category))
            .map((t) => t.name),
        ),
      ],
      nonEssentialCookies,
      recommendation: needsConsentTool
        ? cookieBannerHtml
          ? "Cookie-Banner erkannt – prüfe, ob Marketing/Analytics vor Zustimmung blockiert werden."
          : "Kein Cookie-Banner erkannt, aber Tracking-Dienste/Cookies vorhanden. Consent-Manager empfohlen."
        : "Kein Banner nötig, da keine nicht-essentiellen Tracker erkannt wurden.",
    };

    const complianceChecks: SeoCheck[] = [
      {
        key: "cookie-consent",
        label: "Cookie-Consent-Tool erkannt (DSGVO/TDDDG)",
        ok: !needsConsentTool || hasConsentTool,
        value: !needsConsentTool ? "nicht nötig" : hasConsentTool ? "ja" : "nein",
        advice:
          needsConsentTool && !hasConsentTool ? "Kein Cookie-Consent-Manager gefunden." : undefined,
        howToFix:
          needsConsentTool && !hasConsentTool
            ? "Integriere ein Consent-Tool (z. B. Usercentrics, Cookiebot, CookieYes, Osano) und blocke Marketing/Analytics-Skripte vor dem Einverständnis."
            : undefined,
        location: "Wird meist als Script im <head> eingebunden; Konfiguration im Tool-Dashboard.",
        learnMore: "https://www.gesetze-im-internet.de/ttdsg/__25.html",
      },
      {
        key: "cookie-banner-detected",
        label: "Cookie-Banner erkannt",
        ok: cookieBannerHtml,
        value: cookieBannerHtml ? (cookieBannerFixed ? "Banner (fixed)" : "Banner") : "keiner",
        advice: !cookieBannerHtml
          ? "Kein Cookie-Banner im HTML oder bekanntes Consent-Tool erkannt."
          : undefined,
        howToFix: !cookieBannerHtml
          ? "Wenn nicht-essentielle Cookies gesetzt werden, integriere ein Consent-Tool mit sichtbarem Banner."
          : undefined,
        location: "Cookie-Consent-Script oder Template.",
        learnMore: "https://www.gesetze-im-internet.de/ttdsg/__25.html",
      },
      {
        key: "non-essential-cookies",
        label: "Nur notwendige Cookies",
        ok: !nonEssentialCookies,
        value: nonEssentialCookies ? "nicht-essentielle gefunden" : "nur notwendige",
        advice: nonEssentialCookies
          ? "Analytics-, Marketing- oder Third-Party-Cookies wurden ohne Einwilligung gesetzt."
          : undefined,
        howToFix: nonEssentialCookies
          ? "Blocke nicht-essentielle Cookies vor dem Einverständnis oder reduziere sie auf technisch notwendige."
          : undefined,
        location: "HTTP-Response Set-Cookie Header oder JavaScript.",
        learnMore: "https://gdpr.eu/cookies/",
      },
      {
        key: "legal-pages",
        label: "Impressum & Datenschutz verlinkt",
        ok: hasImprint && hasPrivacy,
        value:
          `${hasImprint ? "Impressum" : ""}${hasImprint && hasPrivacy ? " + " : ""}${hasPrivacy ? "Datenschutz" : ""}` ||
          "-",
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
        findings: emptyLinkFindings,
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
    ].filter((c) => {
      const shopOnlyKeys = ["odr-link", "shop-terms", "cancellation-access", "button-solution"];
      if (shopOnlyKeys.includes(c.key) && !isEcommerceSite) return false;
      return true;
    });
    const compliancePassed = complianceChecks.filter((c) => c.ok).length;
    const complianceScore = scoreFromChecks(compliancePassed, complianceChecks.length);

    const seoScore = scoreFromChecks(seoPassed, seoChecks.length);
    const secScore = scoreFromChecks(secPassed, securityHeaders.length);
    // Mobile checks
    const viewportMeta = viewport;
    const hasViewport = !!viewportMeta;
    const viewportResponsive =
      hasViewport &&
      /width\s*=\s*device-width/i.test(viewportMeta) &&
      /initial-scale\s*=\s*1/i.test(viewportMeta);
    const viewportBlocksZoom = hasViewport && /user-scalable\s*=\s*no/i.test(viewportMeta);
    const hasMediaQueries =
      /<style[^>]*>[^]*?@media\s+[^]*?<\/style>/i.test(html) ||
      /<link[^>]*media\s*=\s*["'][^"']*\d+[^"']*["'][^>]*>/i.test(html) ||
      /<style[^>]*>[^]*?@media\s*\(/i.test(html);
    const hasResponsiveFramework =
      techNames.has("Bootstrap") ||
      techNames.has("Tailwind CSS") ||
      techNames.has("Foundation") ||
      techNames.has("Bulma") ||
      techNames.has("Materialize") ||
      techNames.has("Chakra UI") ||
      techNames.has("MUI") ||
      techNames.has("Ant Design") ||
      techNames.has("shadcn/ui") ||
      techNames.has("Responsive Web Design");
    const smallClickable = [...html.matchAll(/<(a|button)\b[^>]*>/gi)].filter((m) => {
      const tag = m[0];
      const width = tag.match(/\bwidth\s*=\s*["']?(\d+)/i)?.[1];
      const height = tag.match(/\bheight\s*=\s*["']?(\d+)/i)?.[1];
      return (width && Number(width) < 44) || (height && Number(height) < 44) || false;
    }).length;
    const smallClickableRatio =
      smallClickable / Math.max(1, [...html.matchAll(/<(a|button)\b/gi)].length);
    const touchTargetsOk = smallClickableRatio < 0.3;
    const mobileChecks: SeoCheck[] = [
      {
        key: "viewport",
        label: "Viewport für Mobile gesetzt",
        ok: hasViewport && viewportResponsive,
        value: viewportMeta ?? "fehlt",
        advice: !hasViewport
          ? "Füge ein Viewport-Meta-Tag im <head> hinzu."
          : !viewportResponsive
            ? "Viewport sollte width=device-width und initial-scale=1 enthalten."
            : undefined,
        howToFix: !hasViewport
          ? '<meta name="viewport" content="width=device-width, initial-scale=1">'
          : !viewportResponsive
            ? 'Setze den Viewport auf: <meta name="viewport" content="width=device-width, initial-scale=1">'
            : undefined,
        location: "<head> im HTML-Template.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag",
      },
      {
        key: "viewport-zoom",
        label: "Zoom nicht blockiert",
        ok: !viewportBlocksZoom,
        value: viewportBlocksZoom ? "blockiert" : "erlaubt",
        advice: viewportBlocksZoom
          ? "user-scalable=no behindert die Bedienbarkeit auf Mobilgeräten und für Screenreader."
          : undefined,
        howToFix: viewportBlocksZoom
          ? 'Entferne user-scalable=no aus dem Viewport: <meta name="viewport" content="width=device-width, initial-scale=1">'
          : undefined,
        location: "<head> im HTML-Template.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag",
      },
      {
        key: "responsive-css",
        label: "Responsive CSS / Media Queries",
        ok: hasMediaQueries || hasResponsiveFramework,
        value: hasMediaQueries ? "Media Queries" : hasResponsiveFramework ? "Framework" : "fehlt",
        advice:
          !hasMediaQueries && !hasResponsiveFramework
            ? "Keine responsiven CSS-Regeln oder Framework erkannt."
            : undefined,
        howToFix:
          !hasMediaQueries && !hasResponsiveFramework
            ? "Füge @media-Queries hinzu oder verwende ein responsives CSS-Framework wie Tailwind CSS / Bootstrap."
            : undefined,
        location: "CSS-Dateien oder <style>-Block im <head>.",
        learnMore:
          "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries",
      },
      {
        key: "touch-targets",
        label: "Touch-Targets ausreichend groß",
        ok: touchTargetsOk,
        value: `${Math.round((1 - smallClickableRatio) * 100)}% OK`,
        advice: !touchTargetsOk ? "Viele klickbare Elemente sind kleiner als 44×44 px." : undefined,
        howToFix: !touchTargetsOk
          ? "Vergrößere Links und Buttons auf mindestens 44×44 px (min-height / min-width)."
          : undefined,
        location: "CSS-Dateien oder Component-Styles.",
        learnMore: "https://www.w3.org/WAI/WCAG21/Understanding/target-size.html",
      },
      {
        key: "mobile-frameworks",
        label: "Mobile / Responsive Framework erkannt",
        ok: hasResponsiveFramework,
        value: hasResponsiveFramework ? "ja" : "nein",
        advice: !hasResponsiveFramework
          ? "Kein bekanntes responsives Framework erkannt."
          : undefined,
        howToFix: !hasResponsiveFramework
          ? "Nutze ein responsives UI-Framework oder native CSS-Grid/Flexbox mit Media Queries."
          : undefined,
        location: "Projekt-Dependencies oder Theme.",
        learnMore:
          "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design",
      },
    ];
    const mobilePassed = mobileChecks.filter((c) => c.ok).length;
    const mobileScore = scoreFromChecks(mobilePassed, mobileChecks.length);

    // Business / UX checks (heuristic from HTML + CSS)
    const hasTelLink = /href\s*=\s*["']tel:/i.test(html);
    const hasMailtoLink = /href\s*=\s*["']mailto:/i.test(html);
    const phoneMatches = html.match(/\+?[0-9][\d\s\-/()]{7,}[\d]/g) || [];
    const hasPhoneNumber = phoneMatches.length > 0;
    const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const hasEmail = emailMatches.length > 0;
    const contactClickableOk = (!hasPhoneNumber || hasTelLink) && (!hasEmail || hasMailtoLink);

    const fixedWidths = [
      ...html.matchAll(/\bwidth\s*:\s*(\d+)px\s*;?/gi),
      ...html.matchAll(/\bwidth\s*=\s*["']?(\d+)px?["']?/gi),
    ].map((m) => Number(m[1]));
    const wideFixedElements = fixedWidths.filter((w) => w > 420).length;
    const fixedWidthRatio = wideFixedElements / Math.max(1, fixedWidths.length);
    const layoutOverflowRisk = fixedWidthRatio < 0.3;

    const styleBlock = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    const allCss = styleBlock.join(" ");
    const smallFontRules = [...allCss.matchAll(/font-size\s*:\s*(\d+)px/gi)].filter(
      (m) => Number(m[1]) < 12,
    ).length;
    const fontSizeOk = smallFontRules === 0 || !hasViewport;

    const imgWithoutMaxWidth = [...html.matchAll(/<img\b[^>]*>/gi)].filter((m) => {
      const tag = m[0];
      const hasStyleMaxWidth = /max-width\s*:\s*100%/i.test(tag);
      const hasClassResponsive =
        /class\s*=\s*["'][^"']*(?:w-full|img-fluid|responsive)[^"']*["']/i.test(tag);
      const hasFixedWidth =
        /\bwidth\s*=\s*["']?\d+["']?/i.test(tag) || /width\s*:\s*\d+px/i.test(tag);
      return hasFixedWidth && !hasStyleMaxWidth && !hasClassResponsive;
    }).length;
    const allImgTags = [...html.matchAll(/<img\b/gi)].length;
    const imgLayoutOk = allImgTags === 0 || imgWithoutMaxWidth / Math.max(1, allImgTags) < 0.3;

    const popupMatches = [
      ...html.matchAll(/class\s*=\s*["'][^"']*(modal|popup|overlay|lightbox|dialog)[^"']*["']/gi),
    ];
    const popupCount = popupMatches.length;
    const popupOk = popupCount === 0 || popupCount < 3;
    const popupFindings: Finding[] = popupMatches.slice(0, 15).map((m) => {
      const snippet = m.input ? (m.input.length > 120 ? m.input.slice(0, 120) + "…" : m.input) : "";
      return {
        type: "negative" as const,
        message: `Element mit Klasse "${m[0]}"`,
        snippet,
        howToFix: "Prüfe, ob das Element Mobilgeräte blockiert. Nutze nicht-blockierende Banner oder verschiebe Inhalte in den Footer.",
      };
    });

    const hamburgerMenu =
      /<button[^>]*class\s*=\s*["'][^"']*(?:hamburger|menu-toggle|navbar-toggler|nav-toggle)[^"']*["']/i.test(
        html,
      ) ||
      /<div[^>]*class\s*=\s*["'][^"']*(?:hamburger|menu-icon|nav-icon)[^"']*["']/i.test(html) ||
      /<svg[^>]*class\s*=\s*["'][^"']*(?:hamburger|menu)[^"']*["']/i.test(html);
    const navLinks = [...html.matchAll(/<nav\b[^>]*>[\s\S]*?<a\b/gi)].length;
    const mobileMenuOk = navLinks === 0 || navLinks < 10 || hamburgerMenu;

    const formCount = [...html.matchAll(/<form\b/gi)].length;
    const businessFormInputs = [...html.matchAll(/<(?:input|select|textarea)\b/gi)].length;
    const formWithoutSubmit = [...html.matchAll(/<form\b/gi)].filter(
      (m) => !/<button\b|<input\b[^>]*type\s*=\s*["']?(?:submit|button)/i.test(m[0]),
    ).length;
    const formsOk = formCount === 0 || formWithoutSubmit === 0;

    const businessChecks: SeoCheck[] = [
      {
        key: "contact-clickable",
        label: "Telefon & E-Mail anklickbar",
        ok: contactClickableOk,
        value: hasTelLink || hasMailtoLink ? "verlinkt" : "nur Text",
        advice: !contactClickableOk
          ? "Telefonnummern oder E-Mail-Adressen sind als reiner Text sichtbar, aber nicht anklickbar."
          : undefined,
        howToFix: !contactClickableOk
          ? 'Nutze <a href="tel:+49123..."> und <a href="mailto:...">, damit Mobilgeräte direkt wählen/mailen können.'
          : undefined,
        location: "Header, Footer, Kontakt-Seite, Impressum.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a",
      },
      {
        key: "fixed-width",
        label: "Festbreiten-Elemente überprüft",
        ok: layoutOverflowRisk,
        value: wideFixedElements > 0 ? `${wideFixedElements} > 420px` : "keine",
        advice: !layoutOverflowRisk
          ? "Viele Elemente haben feste Breiten > 420px – das kann auf Mobilgeräten horizontalen Scroll erzeugen."
          : undefined,
        howToFix: !layoutOverflowRisk
          ? "Ersetze feste px-Breiten durch relative Werte (%, max-width: 100%, flex/grid) oder verwende Media Queries."
          : undefined,
        location: "CSS-Dateien oder <style>-Blöcke.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/CSS/max-width",
      },
      {
        key: "font-size",
        label: "Schrift auf Mobilgeräten lesbar",
        ok: fontSizeOk,
        value: smallFontRules > 0 ? `${smallFontRules} < 12px Regeln` : "ok",
        advice: !fontSizeOk
          ? "CSS enthält sehr kleine Font-Größen (< 12px), die auf Smartphones schwer lesbar sind."
          : undefined,
        howToFix: !fontSizeOk
          ? "Setze mindestens 16px für Body-Text auf Mobilgeräten und verwende clamp()/rem."
          : undefined,
        location: "CSS-Dateien oder <style>-Blöcke.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/CSS/font-size",
      },
      {
        key: "images-responsive",
        label: "Bilder sprengen Layout nicht",
        ok: imgLayoutOk,
        value: imgWithoutMaxWidth > 0 ? `${imgWithoutMaxWidth} Bilder` : "ok",
        advice: !imgLayoutOk
          ? "Einige Bilder haben feste Breiten ohne max-width: 100% und können das Layout auf Mobilgeräten sprengen."
          : undefined,
        howToFix: !imgLayoutOk
          ? "Füge allen Bildern max-width: 100%; height: auto; hinzu oder nutze responsive Bild-Klassen."
          : undefined,
        location: "CSS-Dateien oder <img>-Tags.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/CSS/max-width",
      },
      {
        key: "popups",
        label: "Pop-ups / Overlays nicht blockierend",
        ok: popupOk,
        value: popupCount > 0 ? `${popupCount} gefunden` : "keine",
        advice: !popupOk
          ? "Viele Pop-ups/Overlays können Formulare und Inhalte auf Mobilgeräten blockieren."
          : undefined,
        howToFix: !popupOk
          ? "Reduziere Pop-ups auf Mobilgeräten, verschiebe sie in den Footer oder nutze dedizierte Seiten."
          : undefined,
        location: "Templates, Marketing-Scripts oder CMS-Plugins.",
        learnMore: "https://web.dev/popups/",
        findings: popupFindings,
      },
      {
        key: "mobile-menu",
        label: "Mobiles Menü erkennbar",
        ok: mobileMenuOk,
        value: hamburgerMenu ? "Hamburger-Menü" : navLinks > 0 ? "Desktop-Links" : "kein Menü",
        advice: !mobileMenuOk
          ? "Viele Navigationslinks ohne erkennbares Hamburger-Menü – auf Smartphones schnell unbrauchbar."
          : undefined,
        howToFix: !mobileMenuOk
          ? "Füge ein responsives Hamburger-Menü ein, das auf kleinen Bildschirmen die Navigation klappt."
          : undefined,
        location: "Header-Template oder Navigations-Komponente.",
        learnMore:
          "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries",
      },
      {
        key: "cookie-banner",
        label: "Cookie-Banner blockiert nicht dauerhaft",
        ok: cookieBannerOk,
        value: cookieBannerHtml ? (cookieBannerFixed ? "fixed position" : "nicht fixed") : "keiner",
        advice: !cookieBannerOk
          ? "Cookie-Banner ist nicht fixed positioniert und könnte Inhalte verdecken oder unzugänglich sein."
          : undefined,
        howToFix: !cookieBannerOk
          ? "Platziere den Cookie-Banner mit position: fixed am unteren oder oberen Rand und sorge für einen klaren Schließen-Button."
          : undefined,
        location: "Cookie-Consent-Script oder Template.",
        learnMore: "https://www.gesetze-im-internet.de/ttdsg/__25.html",
      },
      {
        key: "forms-usable",
        label: "Formulare absendbar",
        ok: formsOk,
        value: formCount > 0 ? `${businessFormInputs} Felder` : "keine Formulare",
        advice: !formsOk
          ? "Formulare ohne erkennbaren Submit-Button sind für Nutzer nicht absendbar."
          : undefined,
        howToFix: !formsOk
          ? 'Füge jedem Formular einen <button type="submit"> oder <input type="submit"> hinzu.'
          : undefined,
        location: "Formular-Templates oder CMS-Formular-Editor.",
        learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form",
      },
    ];
    const businessPassed = businessChecks.filter((c) => c.ok).length;
    const businessScore = scoreFromChecks(businessPassed, businessChecks.length);

    // WordPress-specific checks
    const isWordPress =
      techNames.has("WordPress") ||
      /wp-content|wp-includes|wp-json|\/wp-admin/i.test(html) ||
      /WordPress[ /]?(\d+\.\d+(\.\d+)?)/i.test(generator ?? "");
    let wpChecks: SeoCheck[] = [];
    let wpScore = 0;
    let restApiStatus: string | undefined;
    if (isWordPress) {
      const wpAdminUrl = new URL("/wp-admin/", finalUrl).toString();
      const wpLoginUrl = new URL("/wp-login.php", finalUrl).toString();
      const xmlRpcUrl = new URL("/xmlrpc.php", finalUrl).toString();
      const restRootUrl = new URL("/wp-json/", finalUrl).toString();
      const restUsersUrl = new URL("/wp-json/wp/v2/users/", finalUrl).toString();
      const [wpAdminRes, wpLoginRes, xmlRpcRes, restRootRes, restUsersRes] = await Promise.all([
        fetchWithTimeout(wpAdminUrl, { method: "HEAD", redirect: "manual" }, 5000).catch(
          () => ({ status: 0 }) as Response,
        ),
        fetchWithTimeout(wpLoginUrl, { method: "HEAD", redirect: "manual" }, 5000).catch(
          () => ({ status: 0 }) as Response,
        ),
        fetchWithTimeout(xmlRpcUrl, { method: "HEAD", redirect: "manual" }, 5000).catch(
          () => ({ status: 0 }) as Response,
        ),
        fetchWithTimeout(restRootUrl, { method: "GET", redirect: "manual" }, 5000).catch(
          () => ({ status: 0 }) as Response,
        ),
        fetchWithTimeout(restUsersUrl, { method: "GET", redirect: "manual" }, 5000).catch(
          () => ({ status: 0 }) as Response,
        ),
      ]);
      const wpAdminReachable = wpAdminRes.status >= 200 && wpAdminRes.status < 400;
      const wpLoginReachable = wpLoginRes.status >= 200 && wpLoginRes.status < 400;
      const xmlRpcReachable = xmlRpcRes.status === 405 || xmlRpcRes.status === 200;
      const restApiActive = restRootRes.status === 200;
      const restUsersReachable = restUsersRes.status === 200;
      restApiStatus = restApiActive
        ? restUsersReachable
          ? "aktiv (Benutzer auflistbar)"
          : "aktiv (Benutzer blockiert)"
        : "blockiert / deaktiviert";

      const wpPlugins = [
        ...new Set(
          [...html.matchAll(/\/wp-content\/plugins\/([^/]+)/gi)].map((m) => m[1].toLowerCase()),
        ),
      ];
      const wpThemes = [
        ...new Set(
          [...html.matchAll(/\/wp-content\/themes\/([^/]+)/gi)].map((m) => m[1].toLowerCase()),
        ),
      ];
      const activeTheme = wpThemes[0] ?? "unbekannt";

      const cachePlugins = new Set([
        "wp-rocket",
        "w3-total-cache",
        "wp-super-cache",
        "litespeed-cache",
        "wp-fastest-cache",
        "autoptimize",
        "breeze",
        "sg-optimizer",
        "swift-performance",
        "perfmatters",
        "flying-press",
        "redis-cache",
        "object-cache-pro",
      ]);
      const hasCachePlugin = wpPlugins.some((p) => cachePlugins.has(p));

      const securityPlugins = new Set([
        "wordfence",
        "sucuri-scanner",
        "all-in-one-wp-security-and-firewall",
        "ithemes-security",
        "bulletproof-security",
        "cerber",
      ]);
      const hasSecurityPlugin = wpPlugins.some((p) => securityPlugins.has(p));

      const pageBuilders = new Set([
        "elementor",
        "wpbakery",
        "js_composer",
        "divi-builder",
        "brizy",
        "beaver-builder",
        "oxygen",
        "breakdance",
        "fl-builder",
      ]);
      const hasPageBuilder = wpPlugins.some((p) => pageBuilders.has(p));

      const heavyPlugins = new Set([
        "revslider",
        "slider-revolution",
        "contact-form-7",
        "woocommerce",
        "elementor-pro",
        "divi-builder",
        "wpbakery",
        "js_composer",
        "yoast-seo",
        "all-in-one-seo-pack",
        "elementor",
      ]);
      const matchedHeavyPlugins = wpPlugins.filter((p) => heavyPlugins.has(p));
      const heavyPluginCount = matchedHeavyPlugins.length;
      const heavyPluginFindings: Finding[] = matchedHeavyPlugins.map((p) => ({
        type: heavyPluginCount > 2 ? "negative" : "info",
        message: `Plugin "${p}" erkannt`,
        howToFix:
          "Prüfe, ob dieses Plugin wirklich nötig ist, und ob Asset-Loading optimiert werden kann.",
      }));

      const generatorLeak = /WordPress[ /]?(\d+\.\d+(\.\d+)?)/i.test(generator ?? "");

      wpChecks = [
        {
          key: "wp-version-leak",
          label: "WordPress-Version nicht öffentlich sichtbar",
          ok: !generatorLeak,
          value: generator ?? "kein Generator",
          advice: generatorLeak
            ? "Das Meta-Generator-Tag verrät die exakte WordPress-Version."
            : undefined,
          howToFix: generatorLeak
            ? "Entferne das Generator-Meta-Tag über functions.php oder ein Security-Plugin."
            : undefined,
          location: "functions.php oder Security-Plugin.",
          learnMore: "https://wordpress.org/documentation/article/hardening-wordpress/",
        },
        {
          key: "wp-admin-hidden",
          label: "wp-admin / wp-login nicht erreichbar",
          ok: !wpAdminReachable && !wpLoginReachable,
          value: wpAdminReachable || wpLoginReachable ? "erreichbar" : "verborgen",
          advice:
            wpAdminReachable || wpLoginReachable
              ? "Login-Seite ist öffentlich erreichbar – erhöht Angriffsfläche."
              : undefined,
          howToFix:
            wpAdminReachable || wpLoginReachable
              ? "Beschränke /wp-admin per IP, .htaccess oder verwende eine Custom-Login-URL."
              : undefined,
          location: ".htaccess, Server-Konfiguration oder Security-Plugin.",
          learnMore: "https://wordpress.org/documentation/article/hardening-wordpress/",
        },
        {
          key: "wp-xmlrpc",
          label: "XML-RPC deaktiviert oder blockiert",
          ok: !xmlRpcReachable,
          value: xmlRpcReachable ? "aktiv" : "blockiert",
          advice: xmlRpcReachable
            ? "XML-RPC kann für Brute-Force- und DDoS-Angriffe missbraucht werden."
            : undefined,
          howToFix: xmlRpcReachable
            ? "Deaktiviere XML-RPC in .htaccess (Require all denied) oder über ein Plugin."
            : undefined,
          location: ".htaccess oder Security-Plugin.",
          learnMore: "https://developer.wordpress.org/reference/functions/xmlrpc_enabled/",
        },
        {
          key: "wp-rest-api",
          label: "WordPress REST API Status",
          ok: true,
          value: restApiStatus,
          advice:
            "Die REST API ist in WordPress standardmäßig aktiv. Headless-Sites brauchen sie; bei klassischen Sites solltest du nur den Users-Endpunkt einschränken.",
          howToFix:
            "Aktivieren/deaktivieren: Filter add_filter('rest_authentication_errors', ...) in functions.php oder Plugin. Ganze API ausschalten: define('REST_API_ENABLED', false) in wp-config.php (nicht empfohlen bei Headless/Gutenberg).",
          location: "functions.php, wp-config.php oder Security-Plugin.",
          learnMore: "https://developer.wordpress.org/rest-api/",
        },
        {
          key: "wp-rest-users",
          label: "REST API User Enumeration blockiert",
          ok: !restUsersReachable,
          value: restUsersReachable ? "Benutzer auflistbar" : "blockiert",
          advice: restUsersReachable
            ? "/wp-json/wp/v2/users/ listet Benutzernamen auf – Angriffsfläche für Brute-Force."
            : undefined,
          howToFix: restUsersReachable
            ? "Blockiere /wp-json/wp/v2/users/ per .htaccess oder mit einem Security-Plugin."
            : undefined,
          location: ".htaccess oder Security-Plugin.",
          learnMore: "https://developer.wordpress.org/rest-api/reference/users/",
        },
        {
          key: "wp-cache",
          label: "Cache-Plugin erkannt",
          ok: hasCachePlugin,
          value: hasCachePlugin ? "ja" : "nein",
          advice: !hasCachePlugin
            ? "Kein Caching-Plugin erkannt – WordPress wird bei jedem Seitenaufruf neu gerendert."
            : undefined,
          howToFix: !hasCachePlugin
            ? "Installiere WP Rocket, LiteSpeed Cache, W3 Total Cache oder WP Super Cache."
            : undefined,
          location: "WordPress-Plugins.",
          learnMore: "https://wordpress.org/plugins/tags/performance/",
        },
        {
          key: "wp-security-plugin",
          label: "Security-Plugin erkannt",
          ok: hasSecurityPlugin,
          value: hasSecurityPlugin ? "ja" : "nein",
          advice: !hasSecurityPlugin
            ? "Kein dediziertes Security-Plugin erkannt – Login-Schutz und WAF fehlen."
            : undefined,
          howToFix: !hasSecurityPlugin
            ? "Installiere Wordfence, iThemes Security oder Sucuri Scanner."
            : undefined,
          location: "WordPress-Plugins.",
          learnMore: "https://wordpress.org/plugins/tags/security/",
        },
        {
          key: "wp-pagebuilder",
          label: "Page Builder Performance",
          ok: !hasPageBuilder,
          value: hasPageBuilder ? "erkannt" : "keiner",
          advice: hasPageBuilder
            ? "Page Builder (Elementor, WPBakery, Divi …) können die Ladezeit deutlich erhöhen."
            : undefined,
          howToFix: hasPageBuilder
            ? "Nutze Caching, Asset-Optimierung (z.B. Perfmatters, WP Rocket), und prüfe, ob ein blockbasierter Editor ausreicht."
            : undefined,
          location: "WordPress-Plugins / Theme.",
          learnMore: "https://web.dev/performance-scoring/",
        },
        {
          key: "wp-plugins-heavy",
          label: "Wenig performance-kritische Plugins",
          ok: heavyPluginCount <= 2,
          value: `${heavyPluginCount} erkannt`,
          advice:
            heavyPluginCount > 2
              ? "Viele bekannte Performance-/Sicherheits-kritische Plugins gleichzeitig aktiv."
              : undefined,
          howToFix:
            heavyPluginCount > 2
              ? "Prüfe, ob alle Plugins wirklich nötig sind, und deaktiviere/ersetze unnötige."
              : undefined,
          location: "WordPress-Plugins.",
          learnMore: "https://wordpress.org/documentation/article/optimization/",
          findings: heavyPluginFindings,
        },
        {
          key: "wp-theme-known",
          label: "Theme erkannt",
          ok: wpThemes.length > 0,
          value: activeTheme,
          advice: wpThemes.length === 0 ? "Kein Theme aus dem HTML erkannt." : undefined,
          howToFix:
            wpThemes.length === 0
              ? "Stelle sicher, dass Theme-Assets aus /wp-content/themes/ geladen werden."
              : undefined,
          location: "/wp-content/themes/",
          learnMore: "https://developer.wordpress.org/themes/",
        },
      ];
      const wpPassed = wpChecks.filter((c) => c.ok).length;
      wpScore = scoreFromChecks(wpPassed, wpChecks.length);
    }

    const overall = Math.round(
      (seoScore + secScore + perfScore + complianceScore + mobileScore + businessScore + wpScore) /
        7,
    );

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
        mobile: mobileScore,
        business: businessScore,
        wordpress: wpScore,
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
      mobileChecks,
      businessChecks,
      wpChecks,
      wpRestApiStatus: isWordPress ? restApiStatus : undefined,
      cookieBanner,
      headers,
      securityHeaders,
      cookies,
      robots,
      sitemap,
      tech,
      languageShares: estimateLanguageShares(html),
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
      http,
      errors,
      warnings,
    };
  });
