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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Minimize2 } from "lucide-react";
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

function ConnectionsGraphInner({ result }: { result: AnalyzeResult }) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    let host = "";
    try {
      host = new URL(result.finalUrl).hostname;
    } catch {
      host = result.url;
    }

    // Center site node
    nodes.push({
      id: "site",
      position: { x: 0, y: 0 },
      data: { label: host },
      style: {
        background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)",
        color: "white",
        border: "2px solid rgba(255,255,255,0.25)",
        boxShadow: "0 0 40px rgba(139,92,246,0.5)",
        borderRadius: 999,
        padding: "18px 26px",
        fontWeight: 700,
        fontSize: 14,
      },
      sourcePosition: undefined,
      targetPosition: undefined,
    });

    // Group tech by category
    const byCat = new Map<TechCategory, typeof result.tech>();
    for (const t of result.tech) {
      if (!byCat.has(t.category)) byCat.set(t.category, []);
      byCat.get(t.category)!.push(t);
    }

    // Group categories by frontend / backend / platform
    const groups: Group[] = ["frontend", "backend", "platform"];
    const groupPositions: Record<Group, { x: number; y: number }> = {
      frontend: { x: -520, y: 0 },
      backend: { x: 520, y: 0 },
      platform: { x: 0, y: 420 },
    };

    for (const group of groups) {
      const groupMeta = GROUP_META[group];
      const groupId = `group-${group}`;
      nodes.push({
        id: groupId,
        position: groupPositions[group],
        data: { label: groupMeta.label },
        style: {
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
        },
      });
      edges.push({
        id: `e-site-${groupId}`,
        source: "site",
        target: groupId,
        animated: true,
        style: { stroke: groupMeta.color, strokeWidth: 2, opacity: 0.7 },
      });
    }

    const cats = [...byCat.keys()];
    const radiusCat = 300;
    cats.forEach((cat, i) => {
      const group = CATEGORY_GROUP[cat];
      const groupMeta = GROUP_META[group];
      const groupCenter = groupPositions[group];

      // distribute categories around their group center
      const groupCats = cats.filter((c) => CATEGORY_GROUP[c] === group);
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
      nodes.push({
        id: catId,
        position: { x: cx, y: cy },
        data: { label: meta.label },
        style: {
          background: "rgba(255,255,255,0.04)",
          color: meta.color,
          border: `1px dashed ${meta.color}`,
          borderRadius: 999,
          padding: "8px 16px",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        },
      });
      edges.push({
        id: `e-group-${group}-${catId}`,
        source: `group-${group}`,
        target: catId,
        animated: true,
        style: { stroke: groupMeta.color, strokeDasharray: "4 4", opacity: 0.6 },
      });

      const items = byCat.get(cat)!;
      const spread = Math.max(180, items.length * 75);
      items.forEach((tech, j) => {
        const offset = (j - (items.length - 1) / 2) * (spread / Math.max(items.length, 1));
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        const outX = groupCenter.x + Math.cos(angle) * (radiusCat + 240) + perpX * offset;
        const outY = groupCenter.y + Math.sin(angle) * (radiusCat + 240) + perpY * offset;
        const id = `tech-${cat}-${j}`;
        nodes.push({
          id,
          position: { x: outX, y: outY },
          data: { label: tech.name },
          style: {
            background: "hsl(224 20% 12%)",
            color: "white",
            border: `1.5px solid ${meta.color}`,
            boxShadow: `0 0 24px ${meta.ring}`,
            borderRadius: 14,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
          },
        });
        edges.push({
          id: `e-${catId}-${id}`,
          source: catId,
          target: id,
          style: { stroke: meta.color, strokeDasharray: "2 6", opacity: 0.7 },
          markerEnd: { type: MarkerType.ArrowClosed, color: meta.color },
        });
      });
    });

    return { nodes, edges };
  }, [result]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
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
      className={`${isFs ? "h-screen" : "h-[600px]"} w-full rounded-2xl border border-border/60 bg-[hsl(224_25%_6%)] overflow-hidden relative`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        panOnScroll
        minZoom={0.2}
      >
        <Background color="#334155" gap={24} size={1} />
        <Controls className="!bg-[hsl(224_25%_10%)] !border-border/60 [&>button]:!bg-transparent [&>button]:!text-white [&>button]:!border-border/40" />
        <FlowPanel position="top-right">
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFs ? "Fullscreen verlassen (Esc)" : "Fullscreen aktivieren"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-[hsl(224_25%_10%)]/90 backdrop-blur px-3 py-1.5 text-xs text-white hover:bg-[hsl(224_25%_14%)] transition"
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
