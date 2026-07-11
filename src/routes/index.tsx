import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Loader2,
  Globe,
  Shield,
  Zap,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  FileText,
  Cookie,
  Code2,
  Link2,
  Layers,
  Bot,
  Map as MapIcon,
  Gauge,
  Server,
  Cpu,
  HelpCircle,
  Wrench,
  BookOpen,
  Info,
  Code,
  Scale,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Network,
  Smartphone,
  Tablet,
  Monitor,
  Store,
  Puzzle,
  Radar,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { analyzeSite, type AnalyzeResult } from "@/lib/analyze.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConnectionsGraph, CATEGORY_META } from "@/components/ConnectionsGraph";
import { ReportPDFDownload } from "@/components/ReportPDF";
import { ReportCompare } from "@/components/ReportCompare";
import { KeywordRankChecker } from "@/components/KeywordRankChecker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SiteScope - Röntgenblick für jede Website" },
      {
        name: "description",
        content:
          "Analysiere jede Website: SEO, Sicherheit, Performance, Tech-Stack, Verbindungen und mehr - in einem Report.",
      },
      { property: "og:title", content: "SiteScope - Röntgenblick für jede Website" },
      {
        property: "og:description",
        content:
          "Analysiere jede Website: SEO, Sicherheit, Performance, Tech-Stack, Verbindungen und mehr - in einem Report.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function scoreColor(n: number) {
  if (n >= 80) return "text-emerald-400";
  if (n >= 60) return "text-amber-400";
  return "text-rose-400";
}
function scoreRing(n: number) {
  if (n >= 80) return "from-emerald-500/40 to-emerald-500/0";
  if (n >= 60) return "from-amber-500/40 to-amber-500/0";
  return "from-rose-500/40 to-rose-500/0";
}

function playSuccessSound() {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const duration = 1.8;

  const master = ctx.createGain();
  master.connect(ctx.destination);
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.18, now + 0.08);
  master.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const freqs = [523.25, 659.25]; // C5 + E5 (sanfter Dur-Akkord)
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(master);

    const start = now + i * 0.08;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.5, start + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.2);

    osc.start(start);
    osc.stop(start + duration);
  });

  setTimeout(() => ctx.close(), duration * 1000 + 200);
}

function Home() {
  const [url, setUrl] = useState("");
  const fn = useServerFn(analyzeSite);
  const m = useMutation({
    mutationFn: (u: string) => fn({ data: { url: u } }),
    onSuccess: () => playSuccessSound(),
  });

  return (
    <div className="min-h-screen text-foreground relative flex flex-col">
      <TechBackground />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Zum Hauptinhalt springen
      </a>

      <header className="border-b border-border/60 backdrop-blur-md fixed top-0 left-0 right-0 z-40 bg-background/85">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 font-semibold tracking-tight">
            <div className="rounded-lg bg-emerald-500/15 p-2">
              <Radar className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg">SiteScope</span>
              <span className="text-[10px] text-muted-foreground tracking-wide">Tech-Radar</span>
            </div>
            <Badge variant="outline" className="ml-1 text-[10px] uppercase tracking-wider">
              beta
            </Badge>
          </div>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            Docs
          </a>
        </div>
      </header>

      <main id="main" className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16">
        {/* Hero + search */}
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live-Analyse · SEO · Security · Tech-Radar
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            Der Röntgenblick für jede Website
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Gib eine URL ein - WordPress, React-App, klassische Homepage - und sieh den ganzen
            Stack, alle Signale und Verbindungen.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim()) m.mutate(url);
            }}
            className="mt-8 flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto"
            aria-label="Website-URL analysieren"
          >
            <div className="relative flex-1">
              <label htmlFor="url-input" className="sr-only">
                Website-URL
              </label>
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com oder https://…"
                className="pl-9 h-12 bg-card/60 backdrop-blur border-border/60 text-base"
                autoFocus
              />
            </div>
            <ScanButton pending={m.isPending} disabled={!url.trim()} />
          </form>

          <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
            {["stripe.com", "vercel.com", "wordpress.org", "shopify.com"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setUrl(s);
                  m.mutate(s);
                }}
                className="rounded-full border border-border/50 px-3 py-1 hover:bg-card transition"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {m.isError && (
          <div className="mt-10 max-w-2xl mx-auto rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200 flex items-start gap-3">
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Analyse fehlgeschlagen</div>
              <div className="text-rose-300/80">{(m.error as Error)?.message}</div>
            </div>
          </div>
        )}

        {m.data && <Results result={m.data} />}
      </main>

      <CollapsibleFooter />
    </div>
  );
}

function CollapsibleFooter() {
  const [open, setOpen] = useState(false);
  return (
    <footer className="relative z-10 border-t border-border/60 bg-card/40 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* single compact row — always visible */}
        <div className="py-3 flex items-center justify-between gap-2 flex-wrap">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-md bg-emerald-500/15 p-1.5">
              <Radar className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-semibold text-foreground tracking-tight text-sm">SiteScope</span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">· Tech-Radar</span>
          </div>

          {/* Center: Links */}
          <div className="flex items-center gap-4">
            <a href="/impressum" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Impressum
            </a>
            <a href="/datenschutz" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Datenschutz
            </a>
            <span className="text-xs text-muted-foreground/50 hidden sm:inline">
              © {new Date().getFullYear()} SiteScope
            </span>
          </div>

          {/* Right: Mehr-Button */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium hover:bg-card transition-colors shrink-0"
            aria-label={open ? "Footer einklappen" : "Footer ausklappen"}
          >
            {open ? (
              <>
                Weniger <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Mehr <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {/* expanded content */}
        {open && (
          <div className="pb-8 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-3 max-w-xl">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SiteScope analysiert Websites in Sekunden. Von SEO und Performance über Security
                  und Compliance bis hin zu Mobile, Business-Checks und WordPress - alles in einem
                  übersichtlichen Dashboard.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "SEO",
                    "Security",
                    "Performance",
                    "Compliance",
                    "Mobile",
                    "Business",
                    "WordPress",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-rose-400" /> Für bessere Websites.
              </span>
            </div>

            <div className="mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                © {new Date().getFullYear()} SiteScope. Gebaut mit{" "}
                <span className="text-foreground">React + TypeScript + Tailwind CSS</span>.
              </span>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}

function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0;
    let H = 0;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);

      const mobile = W < 768;
      const COLS = mobile ? 16 : 40;
      const ROWS = mobile ? 10 : 22;
      const waveAmp1 = mobile ? 10 : 28;
      const waveAmp2 = mobile ? 6 : 16;
      const waveRange = (waveAmp1 + waveAmp2) * 2;

      const colGap = W / (COLS - 1);
      const rowGap = H / (ROWS - 1);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = c * colGap;
          const baseY = r * rowGap;

          // wave displacement: two overlapping sine waves
          const wave1 = Math.sin(c * 0.35 + t * 0.0007 + r * 0.2) * waveAmp1;
          const wave2 = Math.sin(c * 0.18 - t * 0.0005 + r * 0.3) * waveAmp2;
          const y = baseY + wave1 + wave2;

          // brightness based on wave height: norm 0..1 (0=trough, 1=crest)
          const norm = (wave1 + wave2 + waveRange / 2) / waveRange;
          const alpha = 0.12 + norm * 0.6;
          const radius = 0.8 + norm * 1.4;

          // crests = white-blue (#94a3c8), troughs = emerald green (#34d399)
          const cr = Math.round(52 + norm * (148 - 52));
          const cg = Math.round(211 + norm * (163 - 211));
          const cb = Math.round(153 + norm * (200 - 153));

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* bottom fade for readability */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
    </div>
  );
}

function ScanButton({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  const isDisabled = Boolean(disabled || pending);
  return (
    <div className="relative sm:translate-x-1">
      {/* outer ripple rings with glow */}
      {pending && (
        <>
          <span
            className="absolute inset-0 rounded-md ring-2 ring-primary/50 shadow-[0_0_16px] shadow-primary/40"
            style={{ animation: "ripple 1.5s ease-out infinite" }}
          />
          <span
            className="absolute inset-0 rounded-md ring-1 ring-primary/40"
            style={{ animation: "ripple 1.5s ease-out infinite 0.35s" }}
          />
          <span
            className="absolute inset-0 rounded-md ring-1 ring-primary/25"
            style={{ animation: "ripple 1.5s ease-out infinite 0.7s" }}
          />
        </>
      )}

      <Button
        type="submit"
        disabled={isDisabled}
        suppressHydrationWarning
        size="lg"
        className={`relative h-12 px-6 gap-2 ${pending ? "animate-pulse" : ""}`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {pending ? "Analysiere…" : "Analysieren"}
      </Button>

      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Results({ result }: { result: AnalyzeResult }) {
  return (
    <section className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Analyseergebnis</h2>
          <p className="text-sm text-muted-foreground">{result.finalUrl}</p>
        </div>
        <div className="flex items-center gap-2">
          <ReportCompare current={result} />
          <ReportPDFDownload result={result} />
        </div>
      </div>
      {/* Top summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          label="Overall"
          value={result.score.overall}
          icon={<Gauge className="h-4 w-4" />}
          tooltip="Durchschnitt aus SEO, Security, Performance, Compliance, Mobile, Business und WordPress."
          improvements={[
            ...result.seoChecks
              .filter((c) => !c.ok)
              .map((c) => ({
                label: `SEO · ${c.label}${c.advice ? `: ${c.advice}` : ""}`,
                howToFix: c.howToFix,
                location: c.location,
                learnMore: c.learnMore,
              })),
            ...result.securityHeaders
              .filter((c) => !c.ok)
              .map((c) => ({
                label: `Security · ${c.name}${c.advice ? `: ${c.advice}` : ""}`,
                howToFix: c.howToFix,
                location: c.location,
                learnMore: c.learnMore,
              })),
            ...result.perfChecks
              .filter((c) => !c.ok)
              .map((c) => ({
                label: `Performance · ${c.label}${c.advice ? `: ${c.advice}` : ""}`,
                howToFix: c.howToFix,
                location: c.location,
                learnMore: c.learnMore,
              })),
            ...result.complianceChecks
              .filter((c) => !c.ok)
              .map((c) => ({
                label: `Compliance · ${c.label}${c.advice ? `: ${c.advice}` : ""}`,
                howToFix: c.howToFix,
                location: c.location,
                learnMore: c.learnMore,
              })),
          ]}
        />
        <ScoreCard
          label="SEO"
          value={result.score.seo}
          icon={<Sparkles className="h-4 w-4" />}
          tooltip="Prüft Title, Meta Description, H1, Canonical, OG, Sprache, Bilder-Alt, HTTPS und mehr."
          improvements={result.seoChecks
            .filter((c) => !c.ok)
            .map((c) => ({
              label: `${c.label}${c.advice ? `: ${c.advice}` : ""}`,
              howToFix: c.howToFix,
              location: c.location,
              learnMore: c.learnMore,
            }))}
        />
        <ScoreCard
          label="Security"
          value={result.score.security}
          icon={<Shield className="h-4 w-4" />}
          tooltip="Prüft moderne Sicherheits-Header (HSTS, CSP, X-Frame-Options, Referrer-Policy …)."
          improvements={result.securityHeaders
            .filter((c) => !c.ok)
            .map((c) => ({
              label: `${c.name}${c.advice ? `: ${c.advice}` : ""}`,
              howToFix: c.howToFix,
              location: c.location,
              learnMore: c.learnMore,
            }))}
        />
        <ScoreCard
          label="Performance"
          value={result.score.performance}
          icon={<Zap className="h-4 w-4" />}
          tooltip="Grober Performance-Score aus TTFB, Payload-Größe, Anzahl Assets, Kompression und Caching."
          improvements={result.perfChecks
            .filter((c) => !c.ok)
            .map((c) => ({
              label: `${c.label}${c.advice ? `: ${c.advice}` : ""}`,
              howToFix: c.howToFix,
              location: c.location,
              learnMore: c.learnMore,
            }))}
        />
        <ScoreCard
          label="Compliance"
          value={result.score.compliance}
          icon={<Scale className="h-4 w-4" />}
          tooltip="Prüft DSGVO/TDDDG-Signale (Cookie-Consent, Impressum, Datenschutz, externe Fonts) und BITV 2.0-Barrierefreiheit (Skip-Link, Labels, Überschriften)."
          improvements={result.complianceChecks
            .filter((c) => !c.ok)
            .map((c) => ({
              label: `${c.label}${c.advice ? `: ${c.advice}` : ""}`,
              howToFix: c.howToFix,
              location: c.location,
              learnMore: c.learnMore,
            }))}
        />
        <ScoreCard
          label="Mobile"
          value={result.score.mobile}
          icon={<Smartphone className="h-4 w-4" />}
          tooltip="Prüft Viewport, Responsive-CSS, Zoom-Erlaubnis, Touch-Target-Größen und bekannte responsive Frameworks."
          improvements={result.mobileChecks
            .filter((c) => !c.ok)
            .map((c) => ({
              label: `${c.label}${c.advice ? `: ${c.advice}` : ""}`,
              howToFix: c.howToFix,
              location: c.location,
              learnMore: c.learnMore,
            }))}
        />
        <ScoreCard
          label="Business"
          value={result.score.business}
          icon={<Store className="h-4 w-4" />}
          tooltip="Prüft typische Business-/UX-Fehler: klickbare Kontakte, Layout-Überlappungen, lesbare Schrift, Pop-ups, Menü, Cookie-Banner und Formulare."
          improvements={result.businessChecks
            .filter((c) => !c.ok)
            .map((c) => ({
              label: `${c.label}${c.advice ? `: ${c.advice}` : ""}`,
              howToFix: c.howToFix,
              location: c.location,
              learnMore: c.learnMore,
            }))}
        />
        <ScoreCard
          label="WordPress"
          value={result.score.wordpress}
          icon={<Puzzle className="h-4 w-4" />}
          tooltip="WordPress-spezifische Security- und Performance-Checks. Deaktiviert, wenn keine WordPress-Installation erkannt wurde."
          improvements={result.wpChecks
            .filter((c) => !c.ok)
            .map((c) => ({
              label: `${c.label}${c.advice ? `: ${c.advice}` : ""}`,
              howToFix: c.howToFix,
              location: c.location,
              learnMore: c.learnMore,
            }))}
          disabled={result.wpChecks.length === 0}
        />
      </div>

      {/* URL bar */}
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {result.meta.favicon ? (
            <img
              src={new URL(result.meta.favicon, result.finalUrl).toString()}
              alt=""
              className="h-8 w-8 rounded"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="h-8 w-8 rounded bg-muted grid place-items-center">
              <Globe className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium truncate">{result.meta.title ?? "-"}</div>
            <a
              href={result.finalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 truncate"
            >
              {result.finalUrl} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Chip icon={<Server className="h-3 w-3" />}>Status {result.status}</Chip>
          <Chip icon={<Zap className="h-3 w-3" />}>{result.timings.ttfb}ms TTFB</Chip>
          <Chip icon={<FileText className="h-3 w-3" />}>{result.timings.downloadKb}KB HTML</Chip>
          <Chip icon={<Code2 className="h-3 w-3" />}>{result.links.scripts} Scripts</Chip>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card/50 backdrop-blur border border-border/60 flex-wrap h-auto">
          <TabsTrigger value="overview" title="Meta, Struktur und Signale auf einen Blick">
            Übersicht
          </TabsTrigger>
          <TabsTrigger
            value="tech"
            title="Alle erkannten Technologien: Frameworks, Analytics, Pixel, CDN, Sprachen, Datenbanken …"
          >
            Tech-Stack ({result.tech.length})
          </TabsTrigger>
          <TabsTrigger value="graph" title="Interaktiver Verbindungs-Graph aller Technologien">
            Verbindungen
          </TabsTrigger>
          <TabsTrigger
            value="seo"
            title="SEO-Checks: Title, Description, Canonical, OG, Alt-Texte …"
          >
            SEO
          </TabsTrigger>
          <TabsTrigger
            value="keywords"
            title="Keyword-Ranking-Check: Wie wird die Seite bei Google gefunden?"
          >
            Keywords
          </TabsTrigger>
          <TabsTrigger value="security" title="Security-Header und Cookie-Flags">
            Security
          </TabsTrigger>
          <TabsTrigger
            value="perf"
            title="Performance-Signale: TTFB, Payload, Kompression, Caching"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger value="crawl" title="robots.txt und sitemap.xml">
            Robots & Sitemap
          </TabsTrigger>
          <TabsTrigger
            value="architecture"
            title="Architektur: Frontend, Backend, CMS, Server, Hosting"
          >
            Architektur
          </TabsTrigger>
          <TabsTrigger value="compliance" title="DSGVO/TDDDG und BITV 2.0 / Barrierefreiheit">
            Recht & BITV
          </TabsTrigger>
          <TabsTrigger
            value="mobile"
            title="Mobile-Optimierung: Viewport, Responsive, Touch-Targets, Frameworks"
          >
            Mobile
          </TabsTrigger>
          <TabsTrigger
            value="business"
            title="Business-/UX-Checks: Kontakte, Layout, Pop-ups, Menü, Formulare"
          >
            Business
          </TabsTrigger>
          {result.wpChecks.length > 0 && (
            <TabsTrigger
              value="wordpress"
              title="WordPress-spezifische Security- und Performance-Checks"
            >
              WordPress
            </TabsTrigger>
          )}
          <TabsTrigger value="raw" title="Alle HTTP Response-Header">
            Headers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 lg:grid-cols-2">
          <Panel title="Meta & Open Graph" icon={<FileText className="h-4 w-4" />}>
            <dl className="text-sm divide-y divide-border/50">
              <MetaRow k="Title" v={result.meta.title} />
              <MetaRow k="Description" v={result.meta.description} />
              <MetaRow k="Canonical" v={result.meta.canonical} />
              <MetaRow k="Language" v={result.meta.lang} />
              <MetaRow k="Generator" v={result.meta.generator} />
              <MetaRow k="Viewport" v={result.meta.viewport} />
              <MetaRow k="Theme Color" v={result.meta.themeColor} />
              <MetaRow k="OG Title" v={result.meta.ogTitle} />
              <MetaRow k="OG Image" v={result.meta.ogImage} />
              <MetaRow k="Twitter Card" v={result.meta.twitterCard} />
            </dl>
          </Panel>

          <div className="space-y-4">
            <Panel title="Struktur" icon={<Layers className="h-4 w-4" />}>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="H1" value={result.headings.h1} />
                <Stat label="H2" value={result.headings.h2} />
                <Stat label="H3" value={result.headings.h3} />
                <Stat label="Internal Links" value={result.links.internal} />
                <Stat label="External Links" value={result.links.external} />
                <Stat label="Images" value={result.links.images} />
              </div>
              {result.headings.h1Text.length > 0 && (
                <div className="mt-4 space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    H1 Text
                  </div>
                  {result.headings.h1Text.map((h, i) => (
                    <div key={i} className="text-sm truncate">
                      • {h}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Social Presence" icon={<Link2 className="h-4 w-4" />}>
              {result.socials.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.socials.map((s) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs hover:bg-card transition"
                    >
                      {s.platform}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Keine Social-Media-Links im Quellcode gefunden.
                </div>
              )}
            </Panel>

            {result.warnings.length > 0 && (
              <Panel title="Warnungen" icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}>
                <ul className="space-y-1.5 text-sm">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tech">
          <TechGrid result={result} />
        </TabsContent>

        <TabsContent value="graph">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              So hängt der Stack zusammen. Ziehen, zoomen, entdecken.
            </p>
            <ConnectionsGraph result={result} />
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <Panel title="SEO Checks" icon={<Sparkles className="h-4 w-4" />}>
            <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Tippe einen Check an, der rot ist - du siehst dann, wo du die Einstellung findest
                und wie du ihn behebst.
              </span>
            </div>
            <ul className="divide-y divide-border/50">
              {result.seoChecks.map((c) => (
                <SeoCheckItem key={c.key} c={c} />
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="keywords">
          <Panel title="Keyword-Ranking-Check" icon={<Search className="h-4 w-4" />}>
            <KeywordRankChecker result={result} />
          </Panel>
        </TabsContent>

        <TabsContent value="security" className="grid gap-4 lg:grid-cols-2">
          <Panel title="Security Header" icon={<Shield className="h-4 w-4" />}>
            <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Header werden fast immer auf dem Server oder CDN gesetzt. Klick ein rotes X an, um
                zu sehen, wo und wie du den Header einstellst.
              </span>
            </div>
            <ul className="divide-y divide-border/50">
              {result.securityHeaders.map((h) => (
                <SecurityItem key={h.name} h={h} />
              ))}
            </ul>
          </Panel>
          <Panel title={`Cookies (${result.cookies.length})`} icon={<Cookie className="h-4 w-4" />}>
            {result.cookies.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Keine Cookies bei der Initial-Response.
              </div>
            ) : (
              <ul className="space-y-2">
                {result.cookies.map((c, i) => (
                  <li key={i} className="rounded-lg border border-border/50 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-xs">{c.name}</div>
                      <CookieCategoryBadge category={c.category} />
                    </div>
                    <div className="mt-1 flex gap-1.5 flex-wrap text-[10px]">
                      <FlagBadge ok={c.secure}>Secure</FlagBadge>
                      <FlagBadge ok={c.httpOnly}>HttpOnly</FlagBadge>
                      <Badge variant="outline" className="text-[10px]">
                        SameSite: {c.sameSite ?? "-"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="perf">
          <Panel title="Performance-Signale" icon={<Zap className="h-4 w-4" />}>
            <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Rot bedeutet: hier lässt sich Geschwindigkeit holen. Jeder Punkt zeigt, wo du
                ansetzt und wo die Einstellung sitzt.
              </span>
            </div>
            <ul className="divide-y divide-border/50">
              {result.perfChecks.map((c) => (
                <SeoCheckItem key={c.key} c={c} />
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="crawl" className="grid gap-4 lg:grid-cols-2">
          <Panel title="robots.txt" icon={<Bot className="h-4 w-4" />}>
            {result.robots.found ? (
              <>
                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  <FlagBadge ok={!result.robots.disallowAll}>
                    {result.robots.disallowAll ? "Blockt alles" : "Crawling erlaubt"}
                  </FlagBadge>
                  <Badge variant="outline" className="text-[10px]">
                    {result.robots.sitemaps.length} Sitemap-Verweise
                  </Badge>
                </div>
                <pre className="text-xs bg-background/50 rounded-lg p-3 overflow-auto max-h-72 border border-border/50">
                  {result.robots.raw}
                </pre>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Keine robots.txt gefunden.</div>
            )}
          </Panel>
          <Panel title="sitemap.xml" icon={<MapIcon className="h-4 w-4" />}>
            {result.sitemap.found ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{result.sitemap.urls}</div>
                <div className="text-sm text-muted-foreground">URLs im Index</div>
                <a
                  href={result.sitemap.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {result.sitemap.url} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Keine sitemap.xml entdeckt.</div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="architecture" className="grid gap-4 lg:grid-cols-2">
          <ArchitecturePanel result={result} />
        </TabsContent>

        <TabsContent value="compliance">
          <CookieConsentPanel result={result} />
          <Panel title="DSGVO / TDDDG & BITV 2.0 Checks" icon={<Scale className="h-4 w-4" />}>
            <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Diese Checks ersetzen keine Rechtsberatung, zeigen aber die wichtigsten Hebel für
                deutsche Datenschutz- und Barrierefreiheits-Anforderungen.
              </span>
            </div>
            <ul className="divide-y divide-border/50">
              {result.complianceChecks.map((c) => (
                <SeoCheckItem key={c.key} c={c} />
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="mobile">
          <Panel title="Mobile-Optimierung" icon={<Smartphone className="h-4 w-4" />}>
            <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Heuristische Prüfung auf Mobil-Tauglichkeit: Viewport, Responsive-CSS, Zoom,
                Touch-Target-Größen und bekannte responsive Frameworks. Kein Ersatz für echte
                Geräte-Tests.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-center">
                <Smartphone className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
                <div className="text-xs text-muted-foreground">Smartphone</div>
                <div className="text-sm font-medium">
                  {result.mobileChecks.find((c) => c.key === "viewport")?.ok ? "bereit" : "prüfen"}
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-center">
                <Tablet className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
                <div className="text-xs text-muted-foreground">Tablet</div>
                <div className="text-sm font-medium">
                  {result.mobileChecks.find((c) => c.key === "responsive-css")?.ok
                    ? "bereit"
                    : "prüfen"}
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-center">
                <Monitor className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
                <div className="text-xs text-muted-foreground">Desktop</div>
                <div className="text-sm font-medium">baseline</div>
              </div>
            </div>
            <ul className="divide-y divide-border/50">
              {result.mobileChecks.map((c) => (
                <SeoCheckItem key={c.key} c={c} />
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="business">
          <Panel title="Business- & UX-Checks" icon={<Store className="h-4 w-4" />}>
            <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Heuristische Prüfung typischer Business-/UX-Fehler aus dem HTML und Inline-CSS:
                klickbare Kontakte, Layout-Überlappungen, lesbare Schrift, Pop-ups, mobiles Menü,
                Cookie-Banner und absendbare Formulare. Kein Ersatz für echte UX-Tests.
              </span>
            </div>
            <ul className="divide-y divide-border/50">
              {result.businessChecks.map((c) => (
                <SeoCheckItem key={c.key} c={c} />
              ))}
            </ul>
          </Panel>
        </TabsContent>

        {result.wpChecks.length > 0 && (
          <TabsContent value="wordpress">
            <Panel title="WordPress-Checks" icon={<Puzzle className="h-4 w-4" />}>
              <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  WordPress-spezifische Sicherheits- und Performance-Checks aus dem HTML und
                  schnellen Endpunkt-Tests. Kein Ersatz für ein vollständiges WordPress-Audit.
                </span>
              </div>
              <ul className="divide-y divide-border/50">
                {result.wpChecks.map((c) => (
                  <SeoCheckItem key={c.key} c={c} />
                ))}
              </ul>
            </Panel>
          </TabsContent>
        )}

        <TabsContent value="raw">
          <Panel title="Response Headers" icon={<Cpu className="h-4 w-4" />}>
            <div className="grid gap-1 text-xs font-mono max-h-[600px] overflow-auto">
              {Object.entries(result.headers).map(([k, v]) => (
                <div
                  key={k}
                  className="grid grid-cols-[220px_1fr] gap-3 py-1 border-b border-border/30"
                >
                  <span className="text-muted-foreground truncate">{k}</span>
                  <span className="break-all">{v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </section>
  );
}

type Improvement = {
  label: string;
  howToFix?: string;
  location?: string;
  learnMore?: string;
};

function ScoreCard({
  label,
  value,
  icon,
  tooltip,
  improvements = [],
  disabled,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tooltip?: string;
  improvements?: Improvement[] | string[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasImprovements = !disabled && value < 100 && improvements.length > 0;
  const items: Improvement[] = improvements.map((imp) =>
    typeof imp === "string" ? { label: imp } : imp,
  );
  return (
    <div
      className={`relative rounded-2xl border p-5 overflow-hidden backdrop-blur-md ${
        disabled ? "border-border/30 bg-card/40" : "border-border/60 bg-card/60"
      }`}
      title={tooltip}
    >
      {!disabled && (
        <div
          className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-linear-to-br ${scoreRing(value)} blur-2xl`}
        />
      )}
      <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wider">
        <span className={`flex items-center gap-1.5 ${disabled ? "line-through opacity-50" : ""}`}>
          {icon}
          {label}
        </span>
        {!disabled && value === 100 && (
          <span className="text-emerald-400 normal-case tracking-normal">perfekt ✓</span>
        )}
      </div>
      <div
        className={`mt-3 text-4xl font-bold tabular-nums ${disabled ? "text-muted-foreground/50" : scoreColor(value)}`}
      >
        {disabled ? "-" : value}
        {!disabled && <span className="text-lg text-muted-foreground">/100</span>}
      </div>
      {!disabled && <Progress value={value} className="mt-3 h-1.5" />}
      {hasImprovements && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-3 text-[11px] text-primary hover:underline flex items-center gap-1"
            title="Zeige die Punkte, die noch fehlen, um 100 zu erreichen"
          >
            {open
              ? "Verbergen"
              : `${items.length} Verbesserung${items.length === 1 ? "" : "en"} anzeigen`}
          </button>
          {open && (
            <ul className="mt-2 space-y-2 text-[11px] text-muted-foreground max-h-56 overflow-auto pr-1">
              {items.map((imp, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <div className="flex gap-1.5">
                    <span className="text-amber-400 shrink-0">•</span>
                    <span className="leading-snug">{imp.label}</span>
                  </div>
                  {(imp.howToFix || imp.location || imp.learnMore) && (
                    <div className="pl-3">
                      <HowToFix
                        howToFix={imp.howToFix}
                        location={imp.location}
                        learnMore={imp.learnMore}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-5">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs">
      {icon}
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function MetaRow({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{k}</span>
      <span className="text-sm wrap-break-word">
        {v ? v : <span className="text-muted-foreground italic">-</span>}
      </span>
    </div>
  );
}

function FlagBadge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${ok ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/15 text-rose-300 border border-rose-500/30"}`}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {children}
    </span>
  );
}

function HowToFix({
  howToFix,
  location,
  learnMore,
}: {
  howToFix?: string;
  location?: string;
  learnMore?: string;
}) {
  if (!howToFix && !location) return null;
  return (
    <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs space-y-2">
      {howToFix && (
        <div className="flex gap-2">
          <Wrench className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span className="text-amber-100/90 leading-relaxed">{howToFix}</span>
        </div>
      )}
      {location && (
        <div className="flex gap-2">
          <HelpCircle className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span className="text-sky-100/80 leading-relaxed">{location}</span>
        </div>
      )}
      {learnMore && (
        <a
          href={learnMore}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          <BookOpen className="h-3 w-3" /> Mehr dazu
        </a>
      )}
    </div>
  );
}

function SeoCheckItem({ c }: { c: AnalyzeResult["seoChecks"][number] }) {
  return (
    <li className="py-3 flex items-start gap-3">
      {c.ok ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm">{c.label}</div>
        <div className="text-xs text-muted-foreground truncate">{c.value}</div>
        {c.advice && !c.ok && <div className="text-xs text-amber-400/90 mt-1">{c.advice}</div>}
        {!c.ok && <HowToFix howToFix={c.howToFix} location={c.location} learnMore={c.learnMore} />}
      </div>
    </li>
  );
}

function SecurityItem({ h }: { h: AnalyzeResult["securityHeaders"][number] }) {
  return (
    <li key={h.name} className="py-3">
      <div className="flex items-center gap-2">
        {h.ok ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <XCircle className="h-4 w-4 text-rose-400" />
        )}
        <span className="text-sm font-mono">{h.name}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground break-all pl-6">
        {h.value ?? <span className="italic">nicht gesetzt</span>}
      </div>
      {h.advice && <div className="pl-6 mt-1 text-xs text-amber-400/90">{h.advice}</div>}
      {!h.ok && (
        <div className="pl-6">
          <HowToFix howToFix={h.howToFix} location={h.location} learnMore={h.learnMore} />
        </div>
      )}
    </li>
  );
}

function CookieCategoryBadge({
  category,
}: {
  category: AnalyzeResult["cookies"][number]["category"];
}) {
  const labels: Record<typeof category, string> = {
    necessary: "notwendig",
    analytics: "analyse",
    marketing: "marketing",
    "third-party": "third-party",
    unknown: "unbekannt",
  };
  const styles: Record<typeof category, string> = {
    necessary: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    analytics: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    marketing: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    "third-party": "bg-sky-500/15 text-sky-300 border-sky-500/30",
    unknown: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${styles[category]}`}
    >
      {labels[category]}
    </span>
  );
}

function CookieConsentPanel({ result }: { result: AnalyzeResult }) {
  const consentCheck = result.complianceChecks.find((c) => c.key === "cookie-consent");
  const bannerCheck = result.complianceChecks.find((c) => c.key === "cookie-banner-detected");
  const nonEssentialCheck = result.complianceChecks.find((c) => c.key === "non-essential-cookies");
  const nonEssentialCookies = result.cookies.filter((c) =>
    ["analytics", "marketing", "third-party"].includes(c.category),
  );

  return (
    <Panel title="Cookie-Consent Zusammenfassung" icon={<Cookie className="h-4 w-4" />}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <div className="text-xs text-muted-foreground mb-1">Consent-Tool</div>
          <div className="text-sm font-medium flex items-center gap-1.5">
            {consentCheck?.ok ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">{consentCheck.value}</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                <span className="text-rose-400">{consentCheck?.value ?? "-"}</span>
              </>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <div className="text-xs text-muted-foreground mb-1">Banner erkannt</div>
          <div className="text-sm font-medium flex items-center gap-1.5">
            {bannerCheck?.ok ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">{bannerCheck.value}</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                <span className="text-rose-400">{bannerCheck?.value ?? "nein"}</span>
              </>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <div className="text-xs text-muted-foreground mb-1">Nicht-notwendige Cookies</div>
          <div className="text-sm font-medium flex items-center gap-1.5">
            {nonEssentialCheck?.ok ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">{nonEssentialCheck.value}</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                <span className="text-rose-400">{nonEssentialCookies.length} erkannt</span>
              </>
            )}
          </div>
        </div>
      </div>
      {nonEssentialCookies.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">Nicht-notwendige Cookies</div>
          <ul className="space-y-2">
            {nonEssentialCookies.map((c, i) => (
              <li key={i} className="rounded-lg border border-border/50 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs">{c.name}</div>
                  <CookieCategoryBadge category={c.category} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function ArchitecturePanel({ result }: { result: AnalyzeResult }) {
  const a = result.architecture;
  const rows = [
    {
      label: "CMS / Shop",
      icon: <Layers className="h-4 w-4" />,
      items: a.cms,
      help: "Das Content-Management-System oder der Shop. Inhalte werden hier gepflegt; Templates/Theme legen das Frontend fest.",
    },
    {
      label: "Frontend",
      icon: <Code className="h-4 w-4" />,
      items: a.frontend,
      help: "Im Browser ausgeführter Teil: Frameworks, UI-Bibliotheken und Styling. Änderungen meist in src/, components/ oder Theme-Dateien.",
    },
    {
      label: "Backend / Sprache",
      icon: <Server className="h-4 w-4" />,
      items: [...new Set([...a.backend, ...a.languages])],
      help: "Server-seitige Sprache oder Runtime. Code liegt auf dem API-Server oder im Hosting-Backend.",
    },
    {
      label: "Backend-Routen / API-Endpunkte",
      icon: <Code2 className="h-4 w-4" />,
      items: a.apiRoutes,
      help: 'Im HTML gefundene Pfade zum Backend: API-Routen, GraphQL, WordPress REST, Next.js Data-Layer, tRPC etc. Das ist dein "Backend-Roster".',
    },
    {
      label: "Webserver",
      icon: <Cpu className="h-4 w-4" />,
      items: a.server,
      help: "Software, die HTTP-Requests entgegennimmt. Konfiguration z. B. in nginx.conf oder .htaccess.",
    },
    {
      label: "Hosting / CDN",
      icon: <Globe className="h-4 w-4" />,
      items: a.hosting,
      help: "Wo die Seite deployed und ausgeliefert wird. Viele Hosts (z. B. Vercel, Netlify, Cloudflare) sind gleichzeitig Edge-CDN.",
    },
  ];

  const detectedServer = result.headers["server"];

  return (
    <>
      <Panel title="Erkannter Aufbau" icon={<Layers className="h-4 w-4" />}>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{a.summary}</p>
        <div className="space-y-3">
          {rows.map((r) => {
            const found = r.items.length > 0;
            return (
              <div
                key={r.label}
                className={`rounded-lg border bg-background/40 p-3 ${
                  found
                    ? "border-emerald-500/60 shadow-[0_0_16px_rgba(16,185,129,0.12)]"
                    : "border-rose-500/60 shadow-[0_0_16px_rgba(244,63,94,0.12)]"
                }`}
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  {r.icon}
                  {r.label}
                </div>
                <div className="text-sm font-medium">
                  {found ? (
                    r.items.join(", ")
                  ) : (
                    <span className="text-muted-foreground italic">nicht erkannt</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{r.help}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Server-Kurzinfo" icon={<Server className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Server-Header
            </div>
            <div className="text-sm font-mono">
              {result.http.server ?? detectedServer ?? (
                <span className="italic text-muted-foreground">nicht gesendet</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                HTTP-Version
              </div>
              <div className="text-sm font-mono">{result.http.version ?? "-"}</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                HTTP/2
              </div>
              <div className="text-sm font-medium flex items-center gap-1.5">
                {result.http.supportsHttp2 ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">aktiv</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    <span className="text-rose-400">nein</span>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                HTTP/3
              </div>
              <div className="text-sm font-medium flex items-center gap-1.5">
                {result.http.supportsHttp3 ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">verfügbar</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">nein</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Content-Encoding
            </div>
            <div className="text-sm font-mono">
              {result.headers["content-encoding"] ?? (
                <span className="italic text-muted-foreground">keine</span>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Cache-Control
            </div>
            <div className="text-sm font-mono">
              {result.headers["cache-control"] ?? (
                <span className="italic text-muted-foreground">nicht gesetzt</span>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            Diese Daten kommen direkt aus den HTTP-Response-Headern. Sie zeigen, welche
            Infrastruktur die Seite ausliefert. Frontend liegt typischerweise auf einem Edge-CDN
            oder Host (z. B. Vercel/Netlify), Backend-APIs oder dynamische Server-Funktionen auf
            einem externen API-Server oder der gleichen Plattform.
          </div>
        </div>
      </Panel>

      <Panel title="Betreiber (aus Impressum)" icon={<Building2 className="h-4 w-4" />}>
        {result.operator.name ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm font-medium">{result.operator.name}</div>
            </div>
            {result.operator.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">{result.operator.address}</div>
              </div>
            )}
            {result.operator.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <a
                  href={`mailto:${result.operator.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {result.operator.email}
                </a>
              </div>
            )}
            {result.operator.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">{result.operator.phone}</div>
              </div>
            )}
            {result.operator.sourceUrl && (
              <a
                href={result.operator.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Quelle <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Kein Impressum gefunden oder Betreiber nicht extrahierbar.
          </div>
        )}
      </Panel>

      <Panel title="Hosting & Infrastruktur" icon={<Network className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">IP</div>
              <div className="text-sm font-mono">{result.hostingDetails.ip ?? "-"}</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Land / Region
              </div>
              <div className="text-sm">
                {result.hostingDetails.country && result.hostingDetails.region
                  ? `${result.hostingDetails.country} - ${result.hostingDetails.region}`
                  : "-"}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              ISP / Organisation
            </div>
            <div className="text-sm">
              {result.hostingDetails.isp ?? result.hostingDetails.org ?? "-"}
            </div>
          </div>
          {result.hostingDetails.nameservers.length > 0 && (
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Nameserver
              </div>
              <div className="text-sm font-mono">
                {result.hostingDetails.nameservers.join(", ")}
              </div>
            </div>
          )}
          {result.hostingDetails.mx.length > 0 && (
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                MX-Records
              </div>
              <ul className="text-sm font-mono space-y-0.5">
                {result.hostingDetails.mx.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-xs text-muted-foreground leading-relaxed">
            IP-Infos kommen aus öffentlichen DNS- und IP-Geolocations-Diensten. Der ISP/Organisation
            zeigt meist den Hosting-Provider (z. B. Hetzner, IONOS, AWS, Vercel) an.
          </div>
        </div>
      </Panel>

      <Panel title="Externe API-Server / Backend-Domains" icon={<Globe className="h-4 w-4" />}>
        {result.externalApis.length > 0 ? (
          <div className="space-y-4">
            <ul className="space-y-2">
              {result.externalApis.map((api, i) => (
                <li key={i} className="text-sm font-mono break-all">
                  {api}
                </li>
              ))}
            </ul>
            {result.backendHosting.length > 0 && (
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Backend-Hosting-Analyse
                </div>
                <div className="space-y-3">
                  {result.backendHosting.map((bh, i) => (
                    <div key={i} className="space-y-1">
                      <div className="text-sm font-medium">{bh.domain}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          IP: <span className="font-mono text-foreground">{bh.ip ?? "-"}</span>
                        </div>
                        <div>
                          Land:{" "}
                          <span className="text-foreground">
                            {bh.country ?? "-"}
                            {bh.region ? ` - ${bh.region}` : ""}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ISP / Org:{" "}
                        <span className="text-foreground">{bh.isp ?? bh.org ?? "-"}</span>
                      </div>
                      {bh.nameservers.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          NS:{" "}
                          <span className="font-mono text-foreground">
                            {bh.nameservers.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Keine externen API-Domains im initialen HTML oder den geladenen Scripts gefunden.
            Client-seitige Fetch-Ziele nach Login/Interaktion werden hier nicht erfasst.
          </div>
        )}
      </Panel>
    </>
  );
}

function TechGrid({ result }: { result: AnalyzeResult }) {
  const grouped = new Map<string, AnalyzeResult["tech"]>();
  for (const t of result.tech) {
    const g: AnalyzeResult["tech"] = grouped.get(t.category) ?? [];
    g.push(t);
    grouped.set(t.category, g);
  }
  if (result.tech.length === 0) {
    return (
      <Panel title="Tech-Stack" icon={<Layers className="h-4 w-4" />}>
        <div className="text-sm text-muted-foreground">Keine bekannten Technologien erkannt.</div>
      </Panel>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...grouped.entries()].map(([cat, items]) => {
        const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
        return (
          <div
            key={cat}
            className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: meta.color }}
              >
                {meta.label}
              </div>
              <div className="text-xs text-muted-foreground">{items.length}</div>
            </div>
            <div className="space-y-2">
              {items.map((t, i) => (
                <div key={i} className="rounded-lg border border-border/40 bg-background/40 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
                      />
                      {t.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      {t.confidence}%
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 truncate font-mono">
                    {t.evidence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
