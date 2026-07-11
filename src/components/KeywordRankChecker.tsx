import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, ExternalLink, KeyRound, AlertCircle } from "lucide-react";
import type { AnalyzeResult } from "@/lib/analyze.functions";
import { checkKeywordRankings, type KeywordRanking } from "@/lib/ranking.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function extractRelevantTerms(result: AnalyzeResult): string[] {
  const parts = [
    result.meta.title ?? "",
    result.meta.description ?? "",
    ...result.headings.h1Text,
    result.finalUrl,
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-zäöüß0-9\s]/g, " ")
    .split(/\s+/)
    .filter((s) => s.length > 3);
  return [...new Set(parts)];
}

function isRelevant(keyword: string, result: AnalyzeResult): boolean {
  const k = keyword.toLowerCase();
  const haystack = [
    result.meta.title ?? "",
    result.meta.description ?? "",
    ...result.headings.h1Text,
    result.finalUrl,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(k);
}

export function KeywordRankChecker({ result }: { result: AnalyzeResult }) {
  const fn = useServerFn(checkKeywordRankings);
  const [keywords, setKeywords] = useState("");
  const [mode, setMode] = useState<"combined" | "individual">("combined");
  const [provider, setProvider] = useState<"google" | "serpapi">("google");
  const [apiKey, setApiKey] = useState("");
  const [searchEngineId, setSearchEngineId] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const m = useMutation({
    mutationFn: async (): Promise<KeywordRanking[]> => {
      const list = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      if (list.length === 0) return [];
      return fn({
        data: {
          url: result.finalUrl,
          keywords: list,
          mode,
          provider,
          apiKey: apiKey.trim() || undefined,
          searchEngineId: searchEngineId.trim() || undefined,
        },
      });
    },
  });

  const suggestions = extractRelevantTerms(result).slice(0, 15);

  const addSuggestion = (term: string) => {
    const current = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (!current.includes(term)) {
      setKeywords(current.concat(term).join(", "));
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/50 bg-background/40 p-4">
        <div className="text-sm font-medium mb-2 flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          Keywords für Ranking-Check
        </div>
        <Input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="z. B. leipzig holzverarbeitung, baumpflege leipzig, ..."
          className="mb-2"
        />
        <p className="text-xs text-muted-foreground">
          Mehrere Begriffe mit Komma trennen. Modus unten wählen: als eine kombinierte Suche oder
          als einzelne Begriffe.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="combined"
            checked={mode === "combined"}
            onChange={() => setMode("combined")}
          />
          Kombinierte Suche
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="individual"
            checked={mode === "individual"}
            onChange={() => setMode("individual")}
          />
          Einzelne Begriffe
        </label>
      </div>

      <div className="text-xs text-muted-foreground">
        {mode === "combined" ? (
          <span>
            Alle Keywords werden zu einer Google-Suche verbunden. Ideal, um zu testen, ob die Seite
            für eine bestimmte Wortkombination gefunden wird.
          </span>
        ) : (
          <span>
            Jeder Begriff wird einzeln bei Google geprüft. So siehst du, für welche Begriffe die
            Seite rankt.
          </span>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="rounded-lg border border-border/50 bg-background/40 p-4">
          <div className="text-xs text-muted-foreground mb-2">Vorschläge aus der Seite</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => addSuggestion(term)}
                className="rounded-full border border-border/60 bg-card/50 px-2.5 py-1 text-xs hover:bg-accent transition"
              >
                + {term}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowSettings((s) => !s)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <KeyRound className="h-3.5 w-3.5" />
        {showSettings
          ? "API-Einstellungen ausblenden"
          : "Google Custom Search API optional aktivieren"}
      </button>

      {showSettings && (
        <div className="space-y-3 rounded-lg border border-border/50 bg-background/40 p-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">API-Anbieter</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as "google" | "serpapi")}
              className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            >
              <option value="google">Google Custom Search (100 Abrufe/Tag kostenlos)</option>
              <option value="serpapi">SerpApi (100 Abrufe/Monat kostenlos)</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">API Key</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === "google" ? "AIza..." : "serpapi-..."}
              />
            </div>
            {provider === "google" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Search Engine ID</label>
                <Input
                  value={searchEngineId}
                  onChange={(e) => setSearchEngineId(e.target.value)}
                  placeholder="cx:..."
                />
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Ohne API-Key werden keine echten Positionen abgefragt. Alle Keywords werden dann
            parallel aufbereitet, aber nur als Google-Suche-Links ausgegeben.
          </div>
        </div>
      )}

      <Button type="button" onClick={() => m.mutate()} disabled={m.isPending || !keywords.trim()}>
        {m.isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Prüfe...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Ranking prüfen
          </span>
        )}
      </Button>

      {m.data && m.data.length > 0 && (
        <div className="space-y-4">
          {mode === "combined" && m.data[0] && (
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Kombinierte Suche
              </div>
              <div className="text-lg font-medium mb-4">„{m.data[0].keyword}“</div>
              {m.data[0].checked ? (
                m.data[0].found ? (
                  <div className="text-4xl font-bold text-emerald-400 mb-2">
                    #{m.data[0].position}
                  </div>
                ) : m.data[0].error ? (
                  <div className="text-rose-400 text-sm mb-2" title={m.data[0].error}>
                    API-Fehler
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-amber-400 mb-2">Nicht in Top 10</div>
                )
              ) : (
                <div className="text-muted-foreground text-sm mb-2">
                  Ohne API-Key wurde nur der Google-Suche-Link erzeugt.
                </div>
              )}
              <a
                href={m.data[0].googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                In Google öffnen
              </a>
            </div>
          )}

          {mode === "individual" && (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-2">Keyword</th>
                    <th className="text-left px-4 py-2">Position</th>
                    <th className="text-left px-4 py-2">Google</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {m.data.map((r) => (
                    <tr key={r.keyword} className="hover:bg-card/30">
                      <td className="px-4 py-3 font-medium">{r.keyword}</td>
                      <td className="px-4 py-3">
                        {r.checked ? (
                          r.found ? (
                            <span className="font-bold text-emerald-400">#{r.position}</span>
                          ) : r.error ? (
                            <span className="text-rose-400 text-xs" title={r.error}>
                              Fehler
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              &gt; 10 / nicht gefunden
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">nicht geprüft</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={r.googleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Suche
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!apiKey && m.data && m.data.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Ohne API-Key werden keine automatischen Positionen abgefragt. Es wurde ein
            Google-Suche-Link für {mode === "combined" ? "die kombinierte Phrase" : "jeden Begriff"}{" "}
            erzeugt. Für echte Rankings trage einen kostenlosen API-Key ein.
          </span>
        </div>
      )}
    </div>
  );
}
