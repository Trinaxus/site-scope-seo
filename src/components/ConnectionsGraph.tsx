import { useMemo, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Panel as FlowPanel,
  useReactFlow,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Minimize2, Lock, Unlock } from "lucide-react";
import {
  forceSimulation,
  forceManyBody,
  forceCollide,
  forceLink,
  forceX,
  forceY,
  forceCenter,
} from "d3-force";
import type { AnalyzeResult, TechCategory } from "@/lib/analyze.functions";

type Group = "frontend" | "backend" | "platform";

const GROUP_META: Record<Group, { label: string; color: string; ring: string }> = {
  frontend: { label: "Frontend", color: "#38bdf8", ring: "rgba(56,189,248,.4)" },
  backend: { label: "Backend", color: "#f97316", ring: "rgba(249,115,22,.4)" },
  platform: { label: "Plattform", color: "#a78bfa", ring: "rgba(167,139,250,.4)" },
};

const CATEGORY_GROUP: Record<TechCategory, Group> = {
  "javascript-framework": "frontend",
  "javascript-library": "frontend",
  "ui-framework": "frontend",
  cdn: "frontend",
  font: "frontend",
  ads: "frontend",
  marketing: "frontend",
  analytics: "frontend",
  "tag-manager": "frontend",
  seo: "frontend",
  "build-tool": "frontend",
  media: "frontend",
  webserver: "backend",
  language: "backend",
  database: "backend",
  hosting: "backend",
  email: "backend",
  security: "backend",
  auth: "backend",
  "error-tracking": "backend",
  search: "backend",
  cms: "platform",
  ecommerce: "platform",
  payment: "platform",
  chat: "platform",
  cdp: "platform",
  privacy: "platform",
  accessibility: "platform",
  misc: "platform",
};

const FRONTEND_HOSTING_NAMES = [
  "Vercel",
  "Netlify",
  "Cloudflare Pages",
  "GitHub Pages",
  "Surge",
  "Render",
  "Railway",
  "Fly.io",
  "GitLab Pages",
];
const BACKEND_HOSTING_NAMES = [
  "Hetzner",
  "IONOS",
  "ALL-INKL",
  "All-Inkl",
  "Neue Medien",
  "Strato",
  "Host Europe",
  "DomainFactory",
  "Contabo",
  "AWS",
  "Google Cloud",
  "Azure",
  "DigitalOcean",
  "Linode",
];

function resolveGroup(cat: TechCategory, techNames: string[], hostingOrg: string | null): Group {
  const namesLower = techNames.map((n) => n.toLowerCase());
  const orgLower = hostingOrg?.toLowerCase() ?? "";

  if (cat === "hosting") {
    if (FRONTEND_HOSTING_NAMES.some((n) => namesLower.includes(n.toLowerCase()))) return "frontend";
    if (
      BACKEND_HOSTING_NAMES.some(
        (n) => orgLower.includes(n.toLowerCase()) || namesLower.includes(n.toLowerCase()),
      )
    )
      return "backend";
    return "frontend";
  }

  if (cat === "webserver") {
    if (namesLower.some((n) => ["vercel", "netlify", "cloudflare", "github pages"].includes(n)))
      return "frontend";
    return "backend";
  }

  if (cat === "language") {
    if (namesLower.includes("javascript") || namesLower.includes("typescript")) return "frontend";
    if (namesLower.includes("php") || namesLower.includes("python") || namesLower.includes("ruby"))
      return "backend";
  }

  return CATEGORY_GROUP[cat];
}

const CATEGORY_META: Record<TechCategory, { label: string; color: string; ring: string }> = {
  "javascript-framework": { label: "JS Framework", color: "#60a5fa", ring: "rgba(96,165,250,.35)" },
  "javascript-library": { label: "JS Library", color: "#7dd3fc", ring: "rgba(125,211,252,.35)" },
  "ui-framework": { label: "UI Framework", color: "#a78bfa", ring: "rgba(167,139,250,.35)" },
  cms: { label: "CMS", color: "#f472b6", ring: "rgba(244,114,182,.35)" },
  ecommerce: { label: "eCommerce", color: "#fb923c", ring: "rgba(251,146,60,.35)" },
  analytics: { label: "Analytics", color: "#34d399", ring: "rgba(52,211,153,.35)" },
  "tag-manager": { label: "Tag Manager", color: "#10b981", ring: "rgba(16,185,129,.35)" },
  cdn: { label: "CDN", color: "#22d3ee", ring: "rgba(34,211,238,.35)" },
  webserver: { label: "Web Server", color: "#94a3b8", ring: "rgba(148,163,184,.35)" },
  language: { label: "Language", color: "#facc15", ring: "rgba(250,204,21,.35)" },
  database: { label: "Database", color: "#38bdf8", ring: "rgba(56,189,248,.35)" },
  hosting: { label: "Hosting", color: "#818cf8", ring: "rgba(129,140,248,.35)" },
  font: { label: "Font", color: "#e879f9", ring: "rgba(232,121,249,.35)" },
  ads: { label: "Ads / Pixel", color: "#f87171", ring: "rgba(248,113,113,.35)" },
  payment: { label: "Payment", color: "#4ade80", ring: "rgba(74,222,128,.35)" },
  marketing: { label: "Marketing", color: "#fbbf24", ring: "rgba(251,191,36,.35)" },
  email: { label: "Email", color: "#fda4af", ring: "rgba(253,164,175,.35)" },
  seo: { label: "SEO", color: "#2dd4bf", ring: "rgba(45,212,191,.35)" },
  security: { label: "Security", color: "#f43f5e", ring: "rgba(244,63,94,.35)" },
  auth: { label: "Auth", color: "#c084fc", ring: "rgba(192,132,252,.35)" },
  "error-tracking": { label: "Error Tracking", color: "#fb7185", ring: "rgba(251,113,133,.35)" },
  chat: { label: "Chat / Support", color: "#5eead4", ring: "rgba(94,234,212,.35)" },
  cdp: { label: "Customer Data", color: "#fcd34d", ring: "rgba(252,211,77,.35)" },
  search: { label: "Search", color: "#93c5fd", ring: "rgba(147,197,253,.35)" },
  media: { label: "Media", color: "#f0abfc", ring: "rgba(240,171,252,.35)" },
  "build-tool": { label: "Build Tool", color: "#a3e635", ring: "rgba(163,230,53,.35)" },
  privacy: { label: "Privacy / Consent", color: "#14b8a6", ring: "rgba(20,184,166,.35)" },
  accessibility: { label: "Accessibility", color: "#f59e0b", ring: "rgba(245,158,11,.35)" },
  misc: { label: "Other", color: "#cbd5e1", ring: "rgba(203,213,225,.35)" },
};

function SiteNode({ data }: { data: { label: string; favicon?: string | null } }) {
  return (
    <div className="flex flex-col items-center gap-2 relative">
      <Handle type="target" position={Position.Top} className="bg-transparent! border-0!" />
      {data.favicon ? (
        <img
          src={data.favicon}
          alt=""
          className="h-10 w-10 rounded-full border-2 border-white/25 bg-white/10 object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="h-10 w-10 rounded-full border-2 border-white/25 bg-white/10 flex items-center justify-center text-xs font-bold text-white">
          {data.label.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="text-white text-sm font-semibold whitespace-nowrap">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="bg-transparent! border-0!" />
    </div>
  );
}

function ConnectionsGraphInner({ result }: { result: AnalyzeResult }) {
  const { nodes, edges } = useMemo(() => {
    let host = "";
    try {
      host = new URL(result.finalUrl).hostname;
    } catch {
      host = result.url;
    }

    const hostingOrg = result.hostingDetails?.org;

    type SimNode = {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      group: Group;
      style: React.CSSProperties;
      data: { label: string; favicon?: string | null };
    };

    const simNodes: SimNode[] = [];
    const edges: Edge[] = [];

    function pushNode(
      id: string,
      x: number,
      y: number,
      label: string,
      group: Group,
      style: React.CSSProperties,
      favicon?: string | null,
    ) {
      // rough size estimation based on label length and padding/fontSize
      const fontSize = typeof style.fontSize === "number" ? style.fontSize : 13;
      const padding =
        typeof style.padding === "string"
          ? style.padding
              .split(" ")
              .map((p) => parseInt(p, 10) || 0)
              .reduce((a, b) => a + b, 0)
          : 28;
      // wider chars for uppercase/W, narrower for lowercase/i; use a weighted average
      const avgCharWidth = fontSize * 0.62;
      const width = Math.max(80, Math.ceil(label.length * avgCharWidth + padding + 24));
      const height = Math.ceil(fontSize * 1.4 + padding + 8);
      simNodes.push({
        id,
        x,
        y,
        width,
        height,
        group,
        style,
        data: { label, favicon },
      });
      return id;
    }

    // Center site node (homepage)
    let faviconUrl = result.meta.favicon;
    if (faviconUrl && !faviconUrl.startsWith("http") && !faviconUrl.startsWith("//")) {
      try {
        faviconUrl = new URL(faviconUrl, result.finalUrl).toString();
      } catch {
        faviconUrl = null;
      }
    }
    pushNode(
      "site",
      0,
      0,
      host,
      "platform",
      {
        background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)",
        color: "white",
        border: "2px solid rgba(255,255,255,0.25)",
        boxShadow: "0 0 40px rgba(139,92,246,0.5)",
        borderRadius: 999,
        padding: "22px 30px",
        fontWeight: 800,
        fontSize: 15,
      },
      faviconUrl,
    );

    // Group tech by category
    const byCat = new Map<TechCategory, typeof result.tech>();
    for (const t of result.tech) {
      if (!byCat.has(t.category)) byCat.set(t.category, []);
      byCat.get(t.category)!.push(t);
    }

    // Group categories by frontend / backend / platform
    const groups: Group[] = ["frontend", "backend", "platform"];
    const groupPositions: Record<Group, { x: number; y: number }> = {
      frontend: { x: -600, y: -80 },
      backend: { x: 600, y: -80 },
      platform: { x: 0, y: 480 },
    };

    for (const group of groups) {
      const groupMeta = GROUP_META[group];
      const groupId = `group-${group}`;
      const gp = groupPositions[group];
      pushNode(groupId, gp.x, gp.y, groupMeta.label, group, {
        background: "rgba(255,255,255,0.04)",
        color: groupMeta.color,
        border: `2px dashed ${groupMeta.color}`,
        boxShadow: `0 0 40px ${groupMeta.ring}`,
        borderRadius: 999,
        padding: "12px 24px",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      });
      edges.push({
        id: `e-site-${groupId}`,
        source: "site",
        target: groupId,
        animated: true,
        style: { stroke: groupMeta.color, strokeWidth: 3, opacity: 0.9 },
      });
    }

    const cats = [...byCat.keys()];
    const radiusCat = 320;
    cats.forEach((cat, i) => {
      const techNames = byCat.get(cat)!.map((t) => t.name);
      const group = resolveGroup(cat, techNames, hostingOrg);
      const groupMeta = GROUP_META[group];
      const groupCenter = groupPositions[group];

      const groupCats = cats.filter(
        (c) =>
          resolveGroup(
            c,
            byCat.get(c)!.map((t) => t.name),
            hostingOrg,
          ) === group,
      );
      const idxInGroup = groupCats.indexOf(cat);
      const angleSpan = Math.PI * 1.2;
      const angle =
        group === "frontend"
          ? -Math.PI / 2 +
            (idxInGroup / Math.max(groupCats.length - 1, 1)) * angleSpan -
            angleSpan / 2
          : group === "backend"
            ? -Math.PI / 2 +
              (idxInGroup / Math.max(groupCats.length - 1, 1)) * angleSpan -
              angleSpan / 2
            : (idxInGroup / Math.max(groupCats.length, 1)) * Math.PI * 2 - Math.PI / 2;

      const cx = groupCenter.x + Math.cos(angle) * radiusCat;
      const cy = groupCenter.y + Math.sin(angle) * radiusCat;
      const meta = CATEGORY_META[cat];
      const catId = `cat-${cat}`;
      pushNode(catId, cx, cy, meta.label, group, {
        background: "rgba(255,255,255,0.04)",
        color: meta.color,
        border: `1px dashed ${meta.color}`,
        borderRadius: 999,
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      });
      edges.push({
        id: `e-group-${group}-${catId}`,
        source: `group-${group}`,
        target: catId,
        animated: true,
        style: { stroke: groupMeta.color, strokeDasharray: "4 4", opacity: 0.8, strokeWidth: 2 },
      });

      const items = byCat.get(cat)!;
      const spread = Math.max(200, items.length * 85);
      items.forEach((tech, j) => {
        const offset = (j - (items.length - 1) / 2) * (spread / Math.max(items.length, 1));
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        const outX = groupCenter.x + Math.cos(angle) * (radiusCat + 260) + perpX * offset;
        const outY = groupCenter.y + Math.sin(angle) * (radiusCat + 260) + perpY * offset;
        const id = `tech-${cat}-${j}`;
        pushNode(id, outX, outY, tech.name, group, {
          background: "hsl(224 20% 12%)",
          color: "white",
          border: `1.5px solid ${meta.color}`,
          boxShadow: `0 0 24px ${meta.ring}`,
          borderRadius: 14,
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 600,
        });
        edges.push({
          id: `e-${catId}-${id}`,
          source: catId,
          target: id,
          style: { stroke: meta.color, strokeDasharray: "2 6", opacity: 0.85, strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: meta.color },
        });
      });
    });

    // Run d3-force simulation to avoid overlaps while keeping the cluster structure
    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, { source: string; target: string }>(
          edges.map((e) => ({ source: e.source, target: e.target })),
        )
          .id((d) => d.id)
          .distance((d) => {
            const s = d.source as unknown as SimNode;
            const t = d.target as unknown as SimNode;
            if (s.id === "site" || t.id === "site") return 260;
            if (s.id.startsWith("group-") || t.id.startsWith("group-")) return 200;
            return 130;
          })
          .strength(0.5),
      )
      .force(
        "collide",
        forceCollide<SimNode>()
          .radius((d) => Math.max(d.width, d.height) / 2 + 18)
          .strength(0.9),
      )
      .force("charge", forceManyBody().strength(-600))
      .force("center", forceCenter(0, 0).strength(0.02))
      .force("groupX", forceX<SimNode>((d) => groupPositions[d.group].x).strength(0.15))
      .force("groupY", forceY<SimNode>((d) => groupPositions[d.group].y).strength(0.15))
      .stop();

    simulation.tick(300);

    const nodes: Node[] = simNodes.map((n) => ({
      id: n.id,
      type: n.id === "site" ? "site" : undefined,
      position: { x: n.x, y: n.y },
      data: n.data,
      style: {
        ...n.style,
        whiteSpace: "nowrap",
        textAlign: "center",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: n.width,
        minWidth: Math.min(n.width, 80),
      },
    }));

    return { nodes, edges };
  }, [result]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  const [locked, setLocked] = useState(true);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 150);
    return () => clearTimeout(timer);
  }, [isFs, fitView]);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setIsFs(true);
    } else {
      await document.exitFullscreen?.();
      setIsFs(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${isFs ? "h-screen" : "h-[600px]"} w-full rounded-2xl border border-border/60 bg-[hsl(222_47%_11%)] overflow-hidden relative`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{ site: SiteNode }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={!locked}
        panOnScroll
        minZoom={0.2}
      >
        <Background color="rgba(255,255,255,0.08)" gap={24} size={1} />
        <Controls className="bg-[hsl(222_47%_13%)]! border-border/60! [&>button]:bg-transparent! [&>button]:text-white! [&>button]:border-border/40!" />
        <FlowPanel position="top-right" className="flex gap-2">
          <button
            type="button"
            onClick={() => setLocked((l) => !l)}
            title={locked ? "Knoten entsperren" : "Knoten sperren"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-[hsl(222_47%_13%)]/90 backdrop-blur px-3 py-1.5 text-xs text-white hover:bg-[hsl(222_47%_17%)] transition"
          >
            {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {locked ? "Gesperrt" : "Beweglich"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFs ? "Fullscreen verlassen (Esc)" : "Fullscreen aktivieren"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-[hsl(222_47%_13%)]/90 backdrop-blur px-3 py-1.5 text-xs text-white hover:bg-[hsl(222_47%_17%)] transition"
          >
            {isFs ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {isFs ? "Verkleinern" : "Fullscreen"}
          </button>
        </FlowPanel>
      </ReactFlow>
    </div>
  );
}

export function ConnectionsGraph({ result }: { result: AnalyzeResult }) {
  return (
    <ReactFlowProvider>
      <ConnectionsGraphInner result={result} />
    </ReactFlowProvider>
  );
}

export { CATEGORY_META };
