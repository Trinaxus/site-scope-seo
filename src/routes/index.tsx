import { useState, useRef, useEffect } from "react";
import * as React from "react";
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
  Database,
  FileJson,
  Image as ImageIcon,
  History,
  GitCompare,
} from "lucide-react";
import { analyzeSite, type AnalyzeResult } from "@/lib/analyze.functions";
import { loadHistory, saveToHistory, deleteHistoryEntry, type HistoryEntry } from "@/lib/history";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const m = useMutation({
    mutationFn: (u: string) => fn({ data: { url: u } }),
    onSuccess: (data) => {
      playSuccessSound();
      setHistory(saveToHistory(data));
    },
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
              <Input
                id="url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com oder https://…"
                className={`h-12 bg-card/60 backdrop-blur text-base transition-all duration-300 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                  url.trim()
                    ? "border-2 border-emerald-400 shadow-[0_0_18px_2px_rgba(52,211,153,0.35)]"
                    : "border-2 border-border/60 focus:border-emerald-400/60 focus:shadow-[0_0_10px_1px_rgba(52,211,153,0.2)]"
                }`}
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

        {m.data && (
          <Results
            result={m.data}
            history={history}
            onLoadHistory={(entry) => {
              setUrl(entry.url);
              m.mutate(entry.url);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onDeleteHistory={(id) => setHistory(deleteHistoryEntry(id))}
            analyze={(u) => fn({ data: { url: u } })}
          />
        )}
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
  const hasUrl = !disabled && !pending;
  return (
    <Button
      type="submit"
      disabled={isDisabled}
      suppressHydrationWarning
      size="lg"
      className={`h-12 px-6 gap-2 shrink-0 transition-all duration-300 ${
        pending
          ? "bg-emerald-500/90 text-primary-foreground backdrop-blur hover:bg-emerald-500"
          : hasUrl
            ? "shadow-[0_0_20px_4px_rgba(52,211,153,0.4)] hover:shadow-[0_0_28px_6px_rgba(52,211,153,0.5)] hover:bg-emerald-400"
            : ""
      }`}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      {pending ? "Analysiere…" : "Analysieren"}
    </Button>
  );
}

function Results({
  result,
  history,
  onLoadHistory,
  onDeleteHistory,
  analyze,
}: {
  result: AnalyzeResult;
  history: HistoryEntry[];
  onLoadHistory: (entry: HistoryEntry) => void;
  onDeleteHistory: (id: string) => void;
  analyze: (url: string) => Promise<AnalyzeResult>;
}) {
  const [mainTab, setMainTab] = useState("overview");
  const [techSubTab, setTechSubTab] = useState("stack");
  const [seoSubTab, setSeoSubTab] = useState("checks");
  const [perfSubTab, setPerfSubTab] = useState("signals");

  const navigateTo = (tab: string, subTab?: string) => {
    setMainTab(tab);
    if (tab === "tech" && subTab) setTechSubTab(subTab);
    if (tab === "seo" && subTab) setSeoSubTab(subTab);
    if (tab === "perf" && subTab) setPerfSubTab(subTab);
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <ScoreCard
          label="Overall"
          value={result.score.overall}
          icon={<Gauge className="h-4 w-4" />}
          tooltip="Durchschnitt aus allen Kategorien."
          tab="overview"
          count={
            result.seoChecks.filter((c) => !c.ok).length +
            result.securityHeaders.filter((c) => !c.ok).length +
            result.perfChecks.filter((c) => !c.ok).length +
            result.complianceChecks.filter((c) => !c.ok).length +
            result.accessibilityChecks.filter((c) => !c.ok).length
          }
          onNavigate={navigateTo}
        />
        <ScoreCard
          label="SEO"
          value={result.score.seo}
          icon={<Sparkles className="h-4 w-4" />}
          tooltip="Prüft Title, Meta Description, H1, Canonical, OG, Sprache, Bilder-Alt, HTTPS und mehr."
          tab="seo"
          subTab="checks"
          count={result.seoChecks.filter((c) => !c.ok).length}
          onNavigate={navigateTo}
        />
        <ScoreCard
          label="Security"
          value={result.score.security}
          icon={<Shield className="h-4 w-4" />}
          tooltip="Prüft moderne Sicherheits-Header (HSTS, CSP, X-Frame-Options, Referrer-Policy …)."
          tab="security"
          count={result.securityHeaders.filter((c) => !c.ok).length}
          onNavigate={navigateTo}
        />
        <ScoreCard
          label="Performance"
          value={result.score.performance}
          icon={<Zap className="h-4 w-4" />}
          tooltip="Grober Performance-Score aus TTFB, Payload-Größe, Anzahl Assets, Kompression und Caching."
          tab="perf"
          subTab="signals"
          count={result.perfChecks.filter((c) => !c.ok).length}
          onNavigate={navigateTo}
        />
        <ScoreCard
          label="Compliance"
          value={result.score.compliance}
          icon={<Scale className="h-4 w-4" />}
          tooltip="Prüft DSGVO/TDDDG-Signale (Cookie-Consent, Impressum, Datenschutz, externe Fonts)."
          tab="compliance"
          count={result.complianceChecks.filter((c) => !c.ok).length}
          onNavigate={navigateTo}
        />
        <ScoreCard
          label="Accessibility"
          value={result.score.accessibility}
          icon={<Heart className="h-4 w-4" />}
          tooltip="BITV 2.0 / WCAG Heuristiken: Sprache, Skip-Link, Formular-Labels, Alt-Texte, Fokus-Styles, reduced-motion."
          tab="compliance"
          count={result.accessibilityChecks.filter((c) => !c.ok).length}
          onNavigate={navigateTo}
        />
        <ScoreCard
          label="Mobile"
          value={result.score.mobile}
          icon={<Smartphone className="h-4 w-4" />}
          tooltip="Prüft Viewport, Responsive-CSS, Zoom-Erlaubnis, Touch-Target-Größen und bekannte responsive Frameworks."
          tab="perf"
          subTab="mobile"
          count={result.mobileChecks.filter((c) => !c.ok).length}
          onNavigate={navigateTo}
        />
        <ScoreCard
          label="Business"
          value={result.score.business}
          icon={<Store className="h-4 w-4" />}
          tooltip="Prüft typische Business-/UX-Fehler: klickbare Kontakte, Layout-Überlappungen, lesbare Schrift, Pop-ups, Menü, Cookie-Banner und Formulare."
          tab="business"
          count={result.businessChecks.filter((c) => !c.ok).length}
          onNavigate={navigateTo}
        />
        <ScoreCard
          label="WordPress"
          value={result.score.wordpress}
          icon={<Puzzle className="h-4 w-4" />}
          tooltip="WordPress-spezifische Security- und Performance-Checks. Deaktiviert, wenn keine WordPress-Installation erkannt wurde."
          tab="wordpress"
          count={result.wpChecks.filter((c) => !c.ok).length}
          onNavigate={navigateTo}
          disabled={result.wpChecks.length === 0}
        />
      </div>

      {/* URL bar */}
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {result.meta.favicon ? (
            <img
              src={new URL(result.meta.favicon, result.finalUrl).toString()}
              alt=""
              className="h-10 w-10 rounded"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="h-10 w-10 rounded bg-muted grid place-items-center">
              <Globe className="h-5 w-5" />
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
          <Chip icon={<Server className="h-3 w-3" />} variant={result.status === 200 ? "success" : result.status && result.status < 400 ? "warning" : "danger"}>
            Status {result.status}
          </Chip>
          <Chip icon={<Zap className="h-3 w-3" />} variant={ttfbVariant(result.timings.ttfb)}>
            {result.timings.ttfb}ms TTFB
          </Chip>
          <Chip icon={<FileText className="h-3 w-3" />}>{result.timings.downloadKb}KB HTML</Chip>
          <Chip icon={<Code2 className="h-3 w-3" />}>{result.links.scripts} Scripts</Chip>
          {result.wpRestApiStatus && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Chip
                      icon={<Globe className="h-3 w-3" />}
                      variant={
                        result.wpRestApiStatus.includes("blockiert")
                          ? "success"
                          : result.wpRestApiStatus.includes("Benutzer auflistbar")
                            ? "danger"
                            : "default"
                      }
                    >
                      REST API: {result.wpRestApiStatus}
                    </Chip>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>
                    Die REST API ist bei Headless-WordPress oder Gutenberg meist beabsichtigt aktiv.
                    Nur „Benutzer auflistbar" ist kritisch, weil Angreifer damit Benutzernamen sammeln können.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Chip
                    icon={<Cookie className="h-3 w-3" />}
                    variant={
                      result.cookieBanner.needsBanner
                        ? result.cookieBanner.detected
                          ? "success"
                          : "danger"
                        : "default"
                    }
                  >
                    Cookies:{" "}
                    {result.cookieBanner.needsBanner
                      ? result.cookieBanner.detected
                        ? "Banner aktiv"
                        : "Banner fehlt"
                      : "keiner nötig"}
                  </Chip>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{result.cookieBanner.recommendation}</p>
                {result.cookieBanner.trackingServices.length > 0 && (
                  <p className="mt-1 text-[10px] opacity-80">
                    Dienste: {result.cookieBanner.trackingServices.join(", ")}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v)} className="space-y-4">
        <TabsList className="bg-card/50 backdrop-blur border border-border/60 h-auto flex flex-wrap gap-1 p-1.5 justify-center">
          <TabsTrigger value="overview" title="Meta, Struktur und Signale auf einen Blick">
            Übersicht
          </TabsTrigger>
          <TabsTrigger
            value="tech"
            title="Technologien, Architektur und Verbindungen"
          >
            Tech ({result.tech.length})
          </TabsTrigger>
          <TabsTrigger value="seo" title="SEO-Checks und Keyword-Ranking">
            SEO
          </TabsTrigger>
          <TabsTrigger value="security" title="Security-Header und Cookie-Flags">
            Security
          </TabsTrigger>
          <TabsTrigger value="perf" title="Performance, Mobile und responsive Vorschau">
            Performance
          </TabsTrigger>
          <TabsTrigger value="compliance" title="DSGVO/TDDDG und BITV 2.0 / Barrierefreiheit">
            Recht & BITV
          </TabsTrigger>
          <TabsTrigger value="compare" title="Zwei Seiten vergleichen">
            Vergleich
          </TabsTrigger>
          <TabsTrigger value="business" title="Business-/UX-Checks">
            Business
          </TabsTrigger>
          <TabsTrigger value="crawl" title="robots.txt, Sitemap und Header">
            Crawl & Raw
          </TabsTrigger>
          {result.wpChecks.length > 0 && (
            <TabsTrigger value="wordpress" title="WordPress-spezifische Checks">
              WordPress
            </TabsTrigger>
          )}
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

            <Panel title={`Letzte Analysen (${history.length})`} icon={<History className="h-4 w-4" />}>
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Noch keine Analysen im Browser gespeichert.
                </div>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-auto">
                  {history.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => onLoadHistory(entry)}
                        className="text-left min-w-0 flex-1"
                      >
                        <div className="text-sm truncate font-medium">{entry.title || entry.url}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {entry.finalUrl} · {new Date(entry.timestamp).toLocaleString("de-DE")}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteHistory(entry.id)}
                        className="text-muted-foreground hover:text-rose-400 text-xs px-2"
                        title="Löschen"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
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
          <Tabs value={techSubTab} onValueChange={(v) => setTechSubTab(v)} className="space-y-4">
            <TabsList className="bg-card/50 backdrop-blur border border-border/60 h-auto flex flex-wrap gap-1 p-1.5">
              <TabsTrigger value="stack">Tech-Stack</TabsTrigger>
              <TabsTrigger value="graph">Verbindungen</TabsTrigger>
              <TabsTrigger value="architecture">Architektur</TabsTrigger>
              <TabsTrigger value="pwa">PWA</TabsTrigger>
            </TabsList>
            <TabsContent value="stack">
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
            <TabsContent value="architecture" className="grid gap-4 lg:grid-cols-2">
              <ArchitecturePanel result={result} />
            </TabsContent>
            <TabsContent value="pwa">
              <Panel title="Progressive Web App (PWA)" icon={<Wrench className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-center">
                    <div className={`text-lg font-bold ${result.pwa.serviceWorkerFound ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {result.pwa.serviceWorkerFound ? "ja" : "nein"}
                    </div>
                    <div className="text-xs text-muted-foreground">Service Worker</div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-center">
                    <div className={`text-lg font-bold ${result.pwa.manifestFound ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {result.pwa.manifestFound ? "ja" : "nein"}
                    </div>
                    <div className="text-xs text-muted-foreground">Manifest erreichbar</div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-center">
                    <div className="text-lg font-bold text-muted-foreground">
                      {result.pwa.display ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">Display-Modus</div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-center">
                    <div className="text-lg font-bold text-muted-foreground">
                      {result.pwa.startUrl ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">Start URL</div>
                  </div>
                </div>
                {result.pwa.serviceWorkerSrc && (
                  <div className="text-sm mb-3">
                    <span className="text-muted-foreground">Service Worker:</span>{" "}
                    <code className="text-xs font-mono bg-muted px-1 rounded">{result.pwa.serviceWorkerSrc}</code>
                  </div>
                )}
                {result.pwa.manifestUrl && (
                  <div className="text-sm mb-3">
                    <span className="text-muted-foreground">Manifest:</span>{" "}
                    <a
                      href={result.pwa.manifestUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline text-xs font-mono break-all"
                    >
                      {result.pwa.manifestUrl}
                    </a>
                  </div>
                )}
                {result.pwa.themeColor && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Theme-Farbe:</span>
                    <span
                      className="inline-block h-4 w-4 rounded border border-border"
                      style={{ backgroundColor: result.pwa.themeColor }}
                    />
                    <code className="text-xs font-mono">{result.pwa.themeColor}</code>
                  </div>
                )}
              </Panel>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="seo">
          <Tabs value={seoSubTab} onValueChange={(v) => setSeoSubTab(v)} className="space-y-4">
            <TabsList className="bg-card/50 backdrop-blur border border-border/60 h-auto flex flex-wrap gap-1 p-1.5">
              <TabsTrigger value="checks">SEO-Checks</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="images">Bilder</TabsTrigger>
              <TabsTrigger value="structure">Struktur</TabsTrigger>
            </TabsList>
            <TabsContent value="checks">
              <Panel title="SEO Checks" icon={<Sparkles className="h-4 w-4" />}>
                <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Tippe einen Check an, der rot ist - du siehst dann, wo du die Einstellung findest
                    und wie du ihn behebst.
                  </span>
                </div>
                <FilteredCheckList
                  items={result.seoChecks}
                  getKey={(c) => c.key}
                  renderItem={(c) => <SeoCheckItem c={c} />}
                />
              </Panel>
            </TabsContent>
            <TabsContent value="keywords">
              <Panel title="Keyword-Ranking-Check" icon={<Search className="h-4 w-4" />}>
                <KeywordRankChecker result={result} />
              </Panel>
            </TabsContent>
            <TabsContent value="images">
              <Panel title={`Bilder (${result.images.length})`} icon={<ImageIcon className="h-4 w-4" />}>
                {result.images.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Keine Bilder im HTML gefunden.</div>
                ) : (
                  <ul className="divide-y divide-border/50 max-h-[600px] overflow-auto">
                    {result.images.map((img, i) => (
                      <li key={i} className="py-3 flex items-start gap-3">
                        <div className="shrink-0 h-16 w-16 rounded bg-muted grid place-items-center overflow-hidden">
                          {img.src ? (
                            <img
                              src={img.src}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-mono truncate text-muted-foreground">
                            {img.src || "kein src"}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <Badge variant={img.alt !== null ? "default" : "destructive"} className="text-[10px]">
                              {img.alt !== null ? (img.alt ? `Alt: ${img.alt.slice(0, 30)}` : "Alt: leer") : "kein alt"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {img.format ?? "unbekannt"}
                            </Badge>
                            {img.lazy && (
                              <Badge variant="outline" className="text-[10px]">
                                lazy
                              </Badge>
                            )}
                            {img.width && img.height && (
                              <Badge variant="outline" className="text-[10px]">
                                {img.width}×{img.height}
                              </Badge>
                            )}
                            {img.inline && (
                              <Badge variant="outline" className="text-[10px]">
                                inline
                              </Badge>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </TabsContent>
            <TabsContent value="structure">
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Heading-Hierarchie" icon={<Code className="h-4 w-4" />}>
                  {result.headings.structure.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Keine Headings gefunden.</div>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {result.headings.structure.map((h, i) => (
                        <li
                          key={i}
                          className="flex gap-3 py-1 border-b border-border/30 last:border-0"
                        >
                          <span className="text-muted-foreground font-mono shrink-0 w-8">H{h.level}</span>
                          <span className="truncate">{h.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel title={`Schema.org (${result.schemas.length})`} icon={<FileJson className="h-4 w-4" />}>
                  {result.schemas.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Kein JSON-LD / Schema.org Markup gefunden.</div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-auto">
                      {result.schemas.map((s, i) => (
                        <div key={i} className="space-y-1">
                          <Badge variant="outline" className="text-[10px]">
                            {s.type ?? "untyped"}
                          </Badge>
                          <pre className="text-[10px] bg-background/50 rounded-lg p-2 overflow-auto border border-border/50">
                            {s.raw}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            </TabsContent>
          </Tabs>
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
            <FilteredCheckList
              items={result.securityHeaders}
              getKey={(h) => h.name}
              renderItem={(h) => <SecurityItem h={h} />}
            />
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
          <Panel title={`Mixed Content (${result.mixedContent.length})`} icon={<Globe className="h-4 w-4" />} className="lg:col-span-2">
            {result.mixedContent.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Keine HTTP-Ressourcen auf HTTPS-Seite gefunden.
              </div>
            ) : (
              <>
                <div className="mb-3 text-xs text-rose-400">
                  Diese Ressourcen werden über HTTP eingebunden und erzeugen in modernen Browsern
                  Sicherheitswarnungen.
                </div>
                <ul className="divide-y divide-border/50 max-h-72 overflow-auto">
                  {result.mixedContent.map((m, i) => (
                    <li key={i} className="py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                        <span className="font-mono text-xs text-muted-foreground break-all">{m.url}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="perf">
          <Tabs value={perfSubTab} onValueChange={(v) => setPerfSubTab(v)} className="space-y-4">
            <TabsList className="bg-card/50 backdrop-blur border border-border/60 h-auto flex flex-wrap gap-1 p-1.5">
              <TabsTrigger value="signals">Performance-Signale</TabsTrigger>
              <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
              <TabsTrigger value="preview">Vorschau</TabsTrigger>
            </TabsList>
            <TabsContent value="signals">
              <Panel title="Performance-Signale" icon={<Zap className="h-4 w-4" />}>
                <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Rot bedeutet: hier lässt sich Geschwindigkeit holen. Jeder Punkt zeigt, wo du
                    ansetzt und wo die Einstellung sitzt.
                  </span>
                </div>
                <FilteredCheckList
                  items={result.perfChecks}
                  getKey={(c) => c.key}
                  renderItem={(c) => <SeoCheckItem c={c} />}
                />
              </Panel>
            </TabsContent>
            <TabsContent value="vitals">
              <PageSpeedPanel result={result} />
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
                <FilteredCheckList
                  items={result.mobileChecks}
                  getKey={(c) => c.key}
                  renderItem={(c) => <SeoCheckItem c={c} />}
                />
              </Panel>
            </TabsContent>
            <TabsContent value="preview">
              <ResponsivePreview url={result.finalUrl} />
            </TabsContent>
          </Tabs>
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
          <Panel title="Links" icon={<Network className="h-4 w-4" />}>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-center">
                <div className="text-xl font-bold">{result.links.internal}</div>
                <div className="text-xs text-muted-foreground">intern</div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-center">
                <div className="text-xl font-bold">{result.links.external}</div>
                <div className="text-xs text-muted-foreground">extern</div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-center">
                <div className="text-xl font-bold">{result.links.nofollow}</div>
                <div className="text-xs text-muted-foreground">nofollow</div>
              </div>
            </div>
            {result.links.topDomains.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium mb-2 text-muted-foreground">Top externe Domains</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.links.topDomains.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {d.domain}: {d.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="text-xs font-medium mb-2 text-muted-foreground">
              {result.linksDetailed.length} verfolgbare Links
            </div>
            <ul className="divide-y divide-border/50 max-h-72 overflow-auto">
              {result.linksDetailed.slice(0, 30).map((link, i) => (
                <li key={i} className="py-2 text-sm">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate block text-xs font-mono"
                    title={link.href}
                  >
                    {link.href}
                  </a>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {link.external && (
                      <Badge variant="outline" className="text-[10px]">
                        extern
                      </Badge>
                    )}
                    {link.nofollow && (
                      <Badge variant="outline" className="text-[10px]">
                        nofollow
                      </Badge>
                    )}
                    {link.targetBlank && (
                      <Badge variant="outline" className="text-[10px]">
                        target="_blank"
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Response Headers" icon={<Cpu className="h-4 w-4" />} className="lg:col-span-2">
            <div className="grid gap-1 text-xs font-mono max-h-[600px] overflow-auto">
              {Object.entries(result.headers).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-start gap-3 py-1.5 px-2 rounded hover:bg-background/50 border-b border-border/30 last:border-0"
                >
                  <span className="shrink-0 w-40 text-muted-foreground">{k}</span>
                  <span className="break-all">{v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="compliance">
          <CookieConsentPanel result={result} />
          <div className="grid gap-4 lg:grid-cols-2 mt-4">
            <Panel title="DSGVO / TDDDG Checks" icon={<Scale className="h-4 w-4" />}>
              <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Diese Checks ersetzen keine Rechtsberatung, zeigen aber die wichtigsten Hebel für
                  deutsche Datenschutz-Anforderungen.
                </span>
              </div>
              <FilteredCheckList
                items={result.complianceChecks}
                getKey={(c) => c.key}
                renderItem={(c) => <SeoCheckItem c={c} />}
              />
            </Panel>
            <Panel title="BITV 2.0 / Barrierefreiheit" icon={<Heart className="h-4 w-4" />}>
              <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Heuristische Prüfung aus dem HTML. Kein Ersatz für einen vollständigen BITV/WCAG-Test
                  mit assistiven Technologien.
                </span>
              </div>
              <FilteredCheckList
                items={result.accessibilityChecks}
                getKey={(c) => c.key}
                renderItem={(c) => <SeoCheckItem c={c} />}
              />
            </Panel>
          </div>
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
            <FilteredCheckList
              items={result.businessChecks}
              getKey={(c) => c.key}
              renderItem={(c) => <SeoCheckItem c={c} />}
            />
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
              <FilteredCheckList
                items={result.wpChecks}
                getKey={(c) => c.key}
                renderItem={(c) => <SeoCheckItem c={c} />}
              />
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
        <TabsContent value="compare">
          <CompareSection analyze={analyze} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function CompareSection({ analyze }: { analyze: (url: string) => Promise<AnalyzeResult> }) {
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [resultA, setResultA] = useState<AnalyzeResult | null>(null);
  const [resultB, setResultB] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlA.trim() || !urlB.trim()) return;
    setLoading(true);
    setError(null);
    setResultA(null);
    setResultB(null);
    try {
      const [a, b] = await Promise.all([analyze(urlA.trim()), analyze(urlB.trim())]);
      setResultA(a);
      setResultB(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vergleich fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel title="Seiten vergleichen" icon={<GitCompare className="h-4 w-4" />}>
        <form onSubmit={runCompare} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Seite A</label>
            <Input
              type="url"
              placeholder="https://beispiel-a.de"
              value={urlA}
              onChange={(e) => setUrlA(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Seite B</label>
            <Input
              type="url"
              placeholder="https://beispiel-b.de"
              value={urlB}
              onChange={(e) => setUrlB(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={loading || !urlA.trim() || !urlB.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitCompare className="h-4 w-4 mr-2" />}
              Vergleichen
            </Button>
          </div>
        </form>
        {error && <div className="mt-3 text-sm text-rose-400">{error}</div>}
      </Panel>

      {resultA && resultB && <ComparisonTable a={resultA} b={resultB} />}
    </div>
  );
}

function ComparisonTable({ a, b }: { a: AnalyzeResult; b: AnalyzeResult }) {
  const rows = [
    { label: "URL", a: a.finalUrl, b: b.finalUrl },
    { label: "Titel", a: a.meta.title ?? "-", b: b.meta.title ?? "-" },
    { label: "Meta Description", a: a.meta.description ?? "-", b: b.meta.description ?? "-" },
    { label: "Gesamt-Score", a: String(a.score.overall), b: String(b.score.overall), numeric: true },
    { label: "SEO", a: String(a.score.seo), b: String(b.score.seo), numeric: true },
    { label: "Security", a: String(a.score.security), b: String(b.score.security), numeric: true },
    { label: "Performance", a: String(a.score.performance), b: String(b.score.performance), numeric: true },
    { label: "Compliance", a: String(a.score.compliance), b: String(b.score.compliance), numeric: true },
    { label: "Accessibility", a: String(a.score.accessibility), b: String(b.score.accessibility), numeric: true },
    { label: "Mobile", a: String(a.score.mobile), b: String(b.score.mobile), numeric: true },
    { label: "Business", a: String(a.score.business), b: String(b.score.business), numeric: true },
    { label: "Technologien", a: String(a.tech.length), b: String(b.tech.length), numeric: true },
    { label: "H1", a: String(a.headings.h1), b: String(b.headings.h1), numeric: true },
    { label: "Interne Links", a: String(a.links.internal), b: String(b.links.internal), numeric: true },
    { label: "Externe Links", a: String(a.links.external), b: String(b.links.external), numeric: true },
    { label: "Bilder", a: String(a.images.length), b: String(b.images.length), numeric: true },
    { label: "Schema.org", a: String(a.schemas.length), b: String(b.schemas.length), numeric: true },
    { label: "TTFB (ms)", a: a.timings.ttfb ? String(Math.round(a.timings.ttfb)) : "-", b: b.timings.ttfb ? String(Math.round(b.timings.ttfb)) : "-", numeric: true, lowerIsBetter: true },
    { label: "Download (KB)", a: String(a.timings.downloadKb), b: String(b.timings.downloadKb), numeric: true, lowerIsBetter: true },
  ];

  const cellClass = "px-3 py-2 text-sm border-b border-border/30";

  return (
    <Panel title="Vergleichsergebnis" icon={<GitCompare className="h-4 w-4" />}>
      <div className="overflow-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border/60">
              <th className="px-3 py-2 font-medium">Kriterium</th>
              <th className="px-3 py-2 font-medium">{a.finalUrl}</th>
              <th className="px-3 py-2 font-medium">{b.finalUrl}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              let aWin = false;
              let bWin = false;
              if (row.numeric) {
                const na = parseFloat(row.a);
                const nb = parseFloat(row.b);
                if (!isNaN(na) && !isNaN(nb)) {
                  if (row.lowerIsBetter) {
                    aWin = na < nb;
                    bWin = nb < na;
                  } else {
                    aWin = na > nb;
                    bWin = nb > na;
                  }
                }
              }
              return (
                <tr key={row.label} className="hover:bg-background/40">
                  <td className={`${cellClass} text-muted-foreground`}>{row.label}</td>
                  <td className={`${cellClass} ${aWin ? "text-emerald-400 font-medium" : ""}`}>{row.a}</td>
                  <td className={`${cellClass} ${bWin ? "text-emerald-400 font-medium" : ""}`}>{row.b}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
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
  tab,
  subTab,
  count,
  onNavigate,
  disabled,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tooltip?: string;
  tab: string;
  subTab?: string;
  count?: number;
  onNavigate: (tab: string, subTab?: string) => void;
  disabled?: boolean;
}) {
  const hasDetails = !disabled && typeof count === "number" && count > 0;
  return (
    <button
      type="button"
      onClick={() => onNavigate(tab, subTab)}
      disabled={disabled}
      className={`relative rounded-2xl border p-5 overflow-hidden backdrop-blur-md text-left w-full transition-colors ${
        disabled
          ? "border-border/30 bg-card/40 cursor-not-allowed"
          : "border-border/60 bg-card/60 hover:bg-card/80 cursor-pointer"
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
      {hasDetails && (
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
          {`${count} Verbesserung${count === 1 ? "" : "en"} anzeigen →`}
        </span>
      )}
    </button>
  );
}

function PageSpeedPanel({ result }: { result: AnalyzeResult }) {
  const { pageSpeed } = result;
  const mobile = pageSpeed.mobile;
  const desktop = pageSpeed.desktop;

  function metricLabel(key: string) {
    switch (key) {
      case "lcp":
        return "Largest Contentful Paint (LCP)";
      case "inp":
        return "Interaction to Next Paint (INP)";
      case "cls":
        return "Cumulative Layout Shift (CLS)";
      case "ttfb":
        return "Time to First Byte (TTFB)";
      case "fcp":
        return "First Contentful Paint (FCP)";
      default:
        return key;
    }
  }

  function metricStatus(key: string, value: number | null, device: "mobile" | "desktop") {
    if (value === null) return { label: "n/a", color: "text-muted-foreground" };
    const isMobile = device === "mobile";
    const good = {
      lcp: isMobile ? 2500 : 1200,
      inp: isMobile ? 200 : 100,
      cls: 0.1,
      ttfb: isMobile ? 1800 : 600,
      fcp: isMobile ? 1800 : 900,
    }[key];
    const poor = {
      lcp: isMobile ? 4000 : 2500,
      inp: isMobile ? 500 : 200,
      cls: 0.25,
      ttfb: isMobile ? 3500 : 1800,
      fcp: isMobile ? 3000 : 1800,
    }[key];
    if (good === undefined || poor === undefined) return { label: value.toString(), color: "text-foreground" };
    if (value <= good!) return { label: "gut", color: "text-emerald-400" };
    if (value <= poor!) return { label: "verbesserungswürdig", color: "text-amber-400" };
    return { label: "schlecht", color: "text-rose-400" };
  }

  function formatValue(key: string, value: number | null) {
    if (value === null) return "-";
    if (key === "cls") return value.toFixed(3);
    return `${Math.round(value)}ms`;
  }

  function MetricCard({
    device,
    data,
  }: {
    device: "mobile" | "desktop";
    data: NonNullable<AnalyzeResult["pageSpeed"]["mobile"]>;
  }) {
    const keys: (keyof typeof data)[] = ["lcp", "inp", "cls", "ttfb", "fcp"];
    const scores = [
      { label: "Performance", value: data.performanceScore },
      { label: "Accessibility", value: data.accessibilityScore },
      { label: "Best Practices", value: data.bestPracticesScore },
      { label: "SEO", value: data.seoScore },
    ];
    return (
      <Panel title={device === "mobile" ? "Mobile" : "Desktop"} icon={<Smartphone className="h-4 w-4" />}>
        {pageSpeed.estimated && (
          <div className="mb-3 text-xs text-amber-400">
            Geschätzte Werte. Für echte Lighthouse-Messungen hinterlege einen{" "}
            <code className="bg-muted px-1 rounded">PAGESPEED_API_KEY</code>.
          </div>
        )}
        {pageSpeed.error && (
          <div className="mb-3 text-xs text-rose-400">
            PageSpeed Insights Fehler: {pageSpeed.error}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {scores.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border/50 bg-background/40 p-3 text-center"
            >
              <div className={`text-xl font-bold ${s.value === null ? "text-muted-foreground" : scoreColor(s.value)}`}>
                {s.value ?? "-"}
              </div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <ul className="divide-y divide-border/50">
          {keys.map((key) => {
            const value = data[key];
            const status = metricStatus(key, value, device);
            return (
              <li key={key} className="py-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{metricLabel(key)}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs">{formatValue(key, value)}</span>
                  <span className={`text-xs ${status.color}`}>{status.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {mobile && <MetricCard device="mobile" data={mobile} />}
      {desktop && <MetricCard device="desktop" data={desktop} />}
      {!mobile && !desktop && (
        <Panel title="Core Web Vitals" icon={<Zap className="h-4 w-4" />}>
          <div className="text-sm text-muted-foreground">Keine PageSpeed-Daten verfügbar.</div>
        </Panel>
      )}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-5", className)}>
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Chip({
  icon,
  children,
  variant = "default",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const styles = {
    default: "border-border/60 bg-background/60",
    success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    warning: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    danger: "border-rose-500/40 bg-rose-500/15 text-rose-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${styles[variant]}`}>
      {icon}
      {children}
    </span>
  );
}

function ttfbVariant(ttfb: number): "success" | "warning" | "danger" {
  if (ttfb <= 200) return "success";
  if (ttfb <= 600) return "warning";
  return "danger";
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
  ok,
}: {
  howToFix?: string;
  location?: string;
  learnMore?: string;
  ok?: boolean;
}) {
  if (!howToFix && !location) return null;
  const wrapperClass = ok
    ? "border-border/30 bg-background/40"
    : "border-amber-500/20 bg-amber-500/5";
  const textClass = ok ? "text-muted-foreground" : "text-amber-100/90";
  return (
    <div className={`mt-2 rounded-lg border p-3 text-xs space-y-2 ${wrapperClass}`}>
      {howToFix && (
        <div className="flex gap-2">
          <Wrench className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${ok ? "text-muted-foreground" : "text-amber-400"}`} />
          <span className={`leading-relaxed ${textClass}`}>{howToFix}</span>
        </div>
      )}
      {location && (
        <div className="flex gap-2">
          <HelpCircle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${ok ? "text-muted-foreground" : "text-sky-400"}`} />
          <span className={ok ? "text-muted-foreground leading-relaxed" : "text-sky-100/80 leading-relaxed"}>
            {location}
          </span>
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

type CheckFilterValue = "all" | "issues" | "ok";

function CheckFilter({
  value,
  onChange,
  counts,
}: {
  value: CheckFilterValue;
  onChange: (v: CheckFilterValue) => void;
  counts: { all: number; issues: number; ok: number };
}) {
  const options: { key: CheckFilterValue; label: string }[] = [
    { key: "all", label: `Alle (${counts.all})` },
    { key: "issues", label: `Probleme (${counts.issues})` },
    { key: "ok", label: `OK (${counts.ok})` },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
            value === opt.key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background/50 text-muted-foreground border-border/60 hover:bg-background"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FilteredCheckList<T extends { ok: boolean }>({
  items,
  renderItem,
  getKey,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T, index: number) => string;
}) {
  const [filter, setFilter] = useState<CheckFilterValue>("all");
  const filtered = items.filter((c) => {
    if (filter === "issues") return !c.ok;
    if (filter === "ok") return c.ok;
    return true;
  });
  const counts = {
    all: items.length,
    issues: items.filter((c) => !c.ok).length,
    ok: items.filter((c) => c.ok).length,
  };
  return (
    <>
      <CheckFilter value={filter} onChange={setFilter} counts={counts} />
      <ul className="divide-y divide-border/50">
        {filtered.map((item, i) => (
          <React.Fragment key={getKey(item, i)}>{renderItem(item)}</React.Fragment>
        ))}
      </ul>
    </>
  );
}

function SeoCheckItem({ c }: { c: AnalyzeResult["seoChecks"][number] }) {
  const [open, setOpen] = useState(false);
  const hasFindings = (c.findings?.length ?? 0) > 0;
  return (
    <li className="py-3">
      <button
        type="button"
        onClick={() => hasFindings && setOpen((o) => !o)}
        className={`w-full flex items-start gap-3 text-left ${hasFindings ? "cursor-pointer" : "cursor-default"}`}
        aria-expanded={hasFindings ? open : undefined}
      >
        {c.ok ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium text-sm">{c.label}</div>
            {hasFindings && (
              <span className="text-[10px] text-muted-foreground">
                {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{c.value}</div>
          {c.advice && (
            <div className={`text-xs mt-1 ${c.ok ? "text-muted-foreground" : "text-amber-400/90"}`}>
              {c.advice}
            </div>
          )}
          {(c.howToFix || c.location || c.learnMore) && (
            <HowToFix howToFix={c.howToFix} location={c.location} learnMore={c.learnMore} ok={c.ok} />
          )}
        </div>
      </button>
      {open && hasFindings && (
        <div className="mt-2 ml-8 space-y-1.5">
          {c.findings!.slice(0, 20).map((f, i) => (
            <div
              key={i}
              className={`rounded-md border px-2.5 py-1.5 text-xs ${
                f.type === "positive"
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : f.type === "negative"
                    ? "border-rose-500/30 bg-rose-500/10"
                    : "border-border/50 bg-background/50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {f.type === "positive" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                {f.type === "negative" && <XCircle className="h-3 w-3 text-rose-400" />}
                {f.type === "info" && <Info className="h-3 w-3 text-blue-400" />}
                <span className="font-medium">{f.message}</span>
              </div>
              {f.snippet && (
                <code className="mt-1 block break-all text-[10px] text-muted-foreground font-mono">
                  {f.snippet}
                </code>
              )}
              {f.howToFix && (
                <div className="mt-1 text-[10px] text-amber-400/90">Fix: {f.howToFix}</div>
              )}
            </div>
          ))}
        </div>
      )}
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
          <div className="text-xs text-muted-foreground mb-1">
            Banner erkannt
            {result.cookieBanner.tool && (
              <span className="ml-1 text-[10px] text-muted-foreground/70">
                ({result.cookieBanner.tool})
              </span>
            )}
          </div>
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
      <div className="mt-4 rounded-lg border border-border/50 bg-background/40 p-3">
        <div className="text-xs text-muted-foreground mb-1">Einschätzung</div>
        <div className="text-sm leading-relaxed">{result.cookieBanner.recommendation}</div>
      </div>

      {result.cookieBanner.trackingServices.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">
            Tracking- & Marketing-Dienste
          </div>
          <div className="flex flex-wrap gap-2">
            {result.cookieBanner.trackingServices.map((service) => (
              <Badge key={service} variant="outline" className="text-[10px]">
                {service}
              </Badge>
            ))}
          </div>
        </div>
      )}

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

type DeviceMode = "desktop" | "tablet" | "mobile";

const DEVICE_SIZES: Record<DeviceMode, { width: number; height: number; label: string; icon: React.ReactNode }> = {
  desktop: { width: 1280, height: 800, label: "Desktop", icon: <Monitor className="h-4 w-4" /> },
  tablet: { width: 768, height: 1024, label: "Tablet", icon: <Tablet className="h-4 w-4" /> },
  mobile: { width: 375, height: 812, label: "Mobile", icon: <Smartphone className="h-4 w-4" /> },
};

function ResponsivePreview({ url }: { url: string }) {
  const [mode, setMode] = useState<DeviceMode>("desktop");
  const [scale, setScale] = useState(1);
  const [blocked, setBlocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const { width } = containerRef.current.getBoundingClientRect();
    const desired = DEVICE_SIZES[mode].width + 48;
    setScale(Math.min(1, width / desired));
  }, [mode]);

  const handleLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      if (e.currentTarget.contentWindow?.location.href === "about:blank") {
        setBlocked(true);
      }
    } catch {
      setBlocked(true);
    }
  };

  return (
    <>
      <Panel title="Responsive Vorschau" icon={<Monitor className="h-4 w-4" />}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {( ["desktop", "tablet", "mobile"] as DeviceMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                mode === m
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-border/60 bg-background/50 hover:bg-card"
              }`}
            >
              {DEVICE_SIZES[m].icon}
              {DEVICE_SIZES[m].label}
              <span className="text-muted-foreground tabular-nums">
                {DEVICE_SIZES[m].width}px
              </span>
            </button>
          ))}
        </div>

        <div
          ref={containerRef}
          className="w-full overflow-auto rounded-xl border border-border/60 bg-muted/20 p-4 flex justify-center min-h-[300px]"
        >
          <div
            style={{
              width: DEVICE_SIZES[mode].width,
              height: DEVICE_SIZES[mode].height,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
            className="relative rounded-lg border border-border/80 bg-background shadow-2xl overflow-hidden"
          >
            {blocked ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <XCircle className="h-8 w-8 text-amber-400 mb-2" />
                <div className="text-sm font-medium">Seite kann nicht eingebettet werden</div>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Die Zielseite verbietet das Laden in einem iframe (X-Frame-Options / CSP). Du kannst sie stattdessen direkt in einem neuen Tab öffnen.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
                >
                  Seite öffnen <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <iframe
                src={url}
                title={`Vorschau ${DEVICE_SIZES[mode].label}`}
                className="absolute inset-0 h-full w-full"
                style={{ border: 0 }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onError={handleLoad}
              />
            )}
          </div>
        </div>
      </Panel>

      <ResponsivePerfHint url={url} />
    </>
  );
}

function ResponsivePerfHint({ url }: { url: string }) {
  const [measurements, setMeasurements] = useState<{ desktop: number | null; mobile: number | null }>({
    desktop: null,
    mobile: null,
  });
  const [loading, setLoading] = useState(false);

  const measure = async (userAgent: string) => {
    const start = performance.now();
    try {
      await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
        headers: { "User-Agent": userAgent },
        cache: "no-store",
      });
    } catch {
      // no-cors requests don't throw on network errors for simple cases
    }
    return Math.round(performance.now() - start);
  };

  const runMeasurement = async () => {
    setLoading(true);
    const desktopUA =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const mobileUA =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

    const [desktop, mobile] = await Promise.all([measure(desktopUA), measure(mobileUA)]);
    setMeasurements({ desktop, mobile });
    setLoading(false);
  };

  const hasData = measurements.desktop !== null && measurements.mobile !== null;

  return (
    <Panel title="Performance-Vergleich: Desktop vs. Mobile" icon={<Zap className="h-4 w-4" />}>
      <div className="mb-3 text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          Misst aus deinem Browser die ungefähre Netzwerk-Antwortzeit (TTFB) mit Desktop- und Mobile-User-Agent.
          Unterschiede entstehen oft durch serverseitiges Device-Routing, unterschiedliche Assets oder CDN-Optimierungen.
        </span>
      </div>
      <button
        type="button"
        onClick={runMeasurement}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-4 py-2 text-xs font-medium hover:bg-card disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
        {loading ? "Messe…" : "Desktop vs. Mobile messen"}
      </button>

      {hasData && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </div>
            <div className="text-xl font-bold tabular-nums">{measurements.desktop}ms</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </div>
            <div className="text-xl font-bold tabular-nums">{measurements.mobile}ms</div>
          </div>
        </div>
      )}

      {hasData && measurements.desktop !== null && measurements.mobile !== null && (
        <div className="mt-3 text-xs">
          {measurements.mobile > measurements.desktop * 1.25 ? (
            <span className="text-amber-400">
              Mobile ist deutlich langsamer. Prüfe responsive Bilder, vermeidbare Redirects oder
              serverseitiges Device-Routing.
            </span>
          ) : measurements.desktop > measurements.mobile * 1.25 ? (
            <span className="text-emerald-400">
              Mobile ist ähnlich schnell oder schneller – gutes Caching / CDN.
            </span>
          ) : (
            <span className="text-muted-foreground">
              Desktop und Mobile liegen nah beieinander.
            </span>
          )}
        </div>
      )}
    </Panel>
  );
}

function ArchitecturePanel({ result }: { result: AnalyzeResult }) {
  const a = result.architecture;

  // JSON-Datenquellen aus dem HTML extrahieren
  const jsonSources = [
    ...new Set(
      [...result.finalUrl.matchAll(/["']([^"']+\.json(?:\?[^"']*)?)["']/gi)].map((m) => m[1]),
    ),
  ];

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
      label: "Datenbank",
      icon: <Database className="h-4 w-4" />,
      items: a.databases ?? [],
      help: "Erkannte oder typische Datenbank-Technologie. Bei WordPress meist MySQL/MariaDB; Firebase/Supabase sind NoSQL/Cloud-Alternativen.",
    },
    {
      label: "JSON-Datenquellen",
      icon: <FileJson className="h-4 w-4" />,
      items: jsonSources,
      help: "Statische .json-Dateien, die im HTML referenziert werden. Das kann eine datenbanklose Lösung sein.",
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

const LANGUAGE_COLORS: Record<string, string> = {
  HTML: "#e34c26",
  CSS: "#563d7c",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  PHP: "#4F5D95",
  Text: "#9ca3af",
};

function LanguageBar({ shares }: { shares: Record<string, number> }) {
  const entries = Object.entries(shares).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Code2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Sprachen</h3>
      </div>
      <div className="h-3 w-full rounded-full overflow-hidden flex">
        {entries.map(([name, pct]) => (
          <div
            key={name}
            style={{ width: `${pct}%`, backgroundColor: LANGUAGE_COLORS[name] ?? "#9ca3af" }}
            className="h-full"
            title={`${name}: ${pct}%`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {entries.map(([name, pct]) => (
          <div key={name} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: LANGUAGE_COLORS[name] ?? "#9ca3af" }}
            />
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground tabular-nums">{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechGrid({ result }: { result: AnalyzeResult }) {
  const grouped = new Map<string, AnalyzeResult["tech"]>();
  for (const t of result.tech) {
    const g: AnalyzeResult["tech"] = grouped.get(t.category) ?? [];
    g.push(t);
    grouped.set(t.category, g);
  }
  if (result.tech.length === 0 && Object.keys(result.languageShares).length === 0) {
    return (
      <Panel title="Tech-Stack" icon={<Layers className="h-4 w-4" />}>
        <div className="text-sm text-muted-foreground">Keine bekannten Technologien erkannt.</div>
      </Panel>
    );
  }
  return (
    <>
      <LanguageBar shares={result.languageShares} />
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
    </>
  );
}
