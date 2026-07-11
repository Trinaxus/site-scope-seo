import { useState, useMemo } from "react";
import { GitCompare, ChevronDown, Trash2 } from "lucide-react";
import type { AnalyzeResult } from "@/lib/analyze.functions";
import { loadReports, deleteReport, type SavedReport } from "@/lib/reportStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function scoreColor(value: number): string {
  if (value >= 80) return "text-emerald-400";
  if (value >= 50) return "text-amber-400";
  return "text-rose-400";
}

function deltaClass(delta: number): string {
  if (delta > 0) return "text-emerald-400";
  if (delta < 0) return "text-rose-400";
  return "text-muted-foreground";
}

export function ReportCompare({ current }: { current: AnalyzeResult }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = () => setSaved(loadReports());

  const baseline = useMemo(
    () => saved.find((r) => r.id === selectedId)?.result ?? null,
    [saved, selectedId],
  );

  const scoreKeys = [
    "overall",
    "seo",
    "security",
    "performance",
    "compliance",
    "mobile",
    "business",
    "wordpress",
  ] as const;

  const problemsCurrent = [
    ...current.seoChecks,
    ...current.perfChecks,
    ...current.complianceChecks,
    ...current.mobileChecks,
    ...current.businessChecks,
    ...current.wpChecks,
  ].filter((c) => !c.ok);

  const problemsBaseline = baseline
    ? [
        ...baseline.seoChecks,
        ...baseline.perfChecks,
        ...baseline.complianceChecks,
        ...baseline.mobileChecks,
        ...baseline.businessChecks,
        ...baseline.wpChecks,
      ].filter((c) => !c.ok)
    : [];

  const fixed = problemsBaseline.filter((b) => !problemsCurrent.some((c) => c.key === b.key));
  const newProblems = problemsCurrent.filter((c) => !problemsBaseline.some((b) => b.key === c.key));

  const openDialog = () => {
    refresh();
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openDialog}
          className="inline-flex items-center gap-1.5"
        >
          <GitCompare className="h-3.5 w-3.5" />
          Vergleichen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Berichtsvergleich</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Wähle einen früheren Export aus, um Fortschritte oder Rückschritte zu sehen.
          </div>

          {saved.length === 0 ? (
            <div className="rounded-lg border border-border/50 p-6 text-center text-sm text-muted-foreground">
              Noch keine gespeicherten Berichte. Exportiere zuerst ein PDF.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => setSelectedId(e.target.value || null)}
                  className="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                >
                  <option value="">Früheren Bericht wählen</option>
                  {saved.map((r) => (
                    <option key={r.id} value={r.id}>
                      {new Date(r.createdAt).toLocaleString("de-DE")} — {r.finalUrl}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedId) {
                      deleteReport(selectedId);
                      refresh();
                      setSelectedId(null);
                    }
                  }}
                  disabled={!selectedId}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {baseline && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="font-medium text-muted-foreground">Kategorie</div>
                    <div className="font-medium text-muted-foreground">Vorher</div>
                    <div className="font-medium text-muted-foreground">Jetzt</div>
                    {scoreKeys.map((key) => {
                      const before = baseline.score[key];
                      const after = current.score[key];
                      const delta = Math.round(after) - Math.round(before);
                      return (
                        <>
                          <div key={`${key}-label`} className="capitalize py-1">
                            {key}
                          </div>
                          <div key={`${key}-before`} className={scoreColor(before)}>
                            {Math.round(before)}%
                          </div>
                          <div key={`${key}-after`} className="flex items-center gap-2">
                            <span className={scoreColor(after)}>{Math.round(after)}%</span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 rotate-0 ${deltaClass(delta)}`}
                              style={{ transform: delta > 0 ? "rotate(180deg)" : undefined }}
                            />
                            <span className={deltaClass(delta)}>{Math.abs(delta)}%</span>
                          </div>
                        </>
                      );
                    })}
                  </div>

                  {fixed.length > 0 && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <div className="text-sm font-semibold text-emerald-400 mb-2">
                        Behoben ({fixed.length})
                      </div>
                      <ul className="space-y-1 text-sm">
                        {fixed.map((c) => (
                          <li key={c.key} className="text-emerald-200">
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {newProblems.length > 0 && (
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4">
                      <div className="text-sm font-semibold text-rose-400 mb-2">
                        Neu hinzugekommen ({newProblems.length})
                      </div>
                      <ul className="space-y-1 text-sm">
                        {newProblems.map((c) => (
                          <li key={c.key} className="text-rose-200">
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fixed.length === 0 && newProblems.length === 0 && (
                    <div className="rounded-lg border border-border/50 p-4 text-center text-sm text-muted-foreground">
                      Keine Änderungen an den Problemstellen festgestellt.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
