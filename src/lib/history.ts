import type { AnalyzeResult } from "./analyze.functions";

export type HistoryEntry = {
  id: string;
  url: string;
  finalUrl: string;
  title: string | null;
  timestamp: number;
  result: AnalyzeResult;
};

const STORAGE_KEY = "site-scope-history";
const MAX_ENTRIES = 20;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function saveToHistory(result: AnalyzeResult): HistoryEntry[] {
  if (!isBrowser()) return [];
  const history = loadHistory();
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    url: result.url,
    finalUrl: result.finalUrl,
    title: result.meta.title,
    timestamp: Date.now(),
    result,
  };
  const filtered = history.filter((h) => h.finalUrl !== result.finalUrl);
  const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteHistoryEntry(id: string): HistoryEntry[] {
  if (!isBrowser()) return [];
  const history = loadHistory();
  const next = history.filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}
