import type { AnalyzeResult } from "./analyze.functions";

const STORAGE_KEY = "sitescope_reports_v1";

export interface SavedReport {
  id: string;
  url: string;
  finalUrl: string;
  createdAt: string;
  result: AnalyzeResult;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReport(result: AnalyzeResult): SavedReport {
  const reports = loadReports();
  const report: SavedReport = {
    id: generateId(),
    url: result.url,
    finalUrl: result.finalUrl,
    createdAt: new Date().toISOString(),
    result,
  };
  // Store newest first, keep last 20
  const updated = [report, ...reports].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return report;
}

export function deleteReport(id: string): void {
  const reports = loadReports().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}
