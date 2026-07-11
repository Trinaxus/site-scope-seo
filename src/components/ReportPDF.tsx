import { Document, Page, Text, View, StyleSheet, usePDF } from "@react-pdf/renderer";
import { FileDown } from "lucide-react";
import type { AnalyzeResult, SeoCheck } from "@/lib/analyze.functions";
import { saveReport } from "@/lib/reportStorage";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    borderBottom: "1px solid #334155",
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#38bdf8",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: "#94a3b8",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#38bdf8",
    marginTop: 20,
    marginBottom: 10,
  },
  scoreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  scoreBox: {
    width: "22%",
    minWidth: 100,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f8fafc",
  },
  scoreLabel: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 4,
  },
  overallBox: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  overallValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
  },
  overallLabel: {
    fontSize: 11,
    color: "#bfdbfe",
    marginTop: 4,
  },
  problemItem: {
    backgroundColor: "#1e293b",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  problemTitle: {
    fontWeight: "bold",
    color: "#fca5a5",
    marginBottom: 4,
  },
  problemMeta: {
    color: "#94a3b8",
    fontSize: 9,
    marginBottom: 4,
  },
  fix: {
    color: "#bae6fd",
    fontSize: 9,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottom: "1px solid #334155",
  },
  rowLabel: {
    color: "#94a3b8",
  },
  rowValue: {
    color: "#f8fafc",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
  },
});

function scoreColor(value: number): string {
  if (value >= 80) return "#34d399";
  if (value >= 50) return "#fbbf24";
  return "#f87171";
}

function collectProblems(result: AnalyzeResult): SeoCheck[] {
  return [
    ...result.seoChecks,
    ...result.perfChecks,
    ...result.complianceChecks,
    ...result.mobileChecks,
    ...result.businessChecks,
    ...result.wpChecks,
  ].filter((c) => !c.ok);
}

export function ReportDocument({ result }: { result: AnalyzeResult }) {
  const problems = collectProblems(result);
  const scores = result.score;
  const date = new Date().toLocaleString("de-DE");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>SiteScope Bericht</Text>
          <Text style={styles.subtitle}>{result.finalUrl}</Text>
          <Text style={styles.subtitle}>Erstellt am {date}</Text>
        </View>

        <View style={styles.overallBox}>
          <Text style={styles.overallValue}>{Math.round(scores.overall)}%</Text>
          <Text style={styles.overallLabel}>Gesamtbewertung</Text>
        </View>

        <Text style={styles.sectionTitle}>Scores</Text>
        <View style={styles.scoreGrid}>
          {(
            [
              ["SEO", scores.seo],
              ["Security", scores.security],
              ["Performance", scores.performance],
              ["Compliance", scores.compliance],
              ["Mobile", scores.mobile],
              ["Business", scores.business],
              ["WordPress", scores.wordpress],
            ] as [string, number][]
          ).map(([label, value]) => (
            <View key={label} style={styles.scoreBox}>
              <Text style={[styles.scoreValue, { color: scoreColor(value) }]}>
                {Math.round(value)}
              </Text>
              <Text style={styles.scoreLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Zu verbessernde Punkte ({problems.length})</Text>
        {problems.slice(0, 12).map((c) => (
          <View key={c.key} style={styles.problemItem}>
            <Text style={styles.problemTitle}>{c.label}</Text>
            {c.value && c.value !== "-" && <Text style={styles.problemMeta}>Wert: {c.value}</Text>}
            {c.advice && <Text style={styles.problemMeta}>{c.advice}</Text>}
            {c.howToFix && <Text style={styles.fix}>Lösung: {c.howToFix}</Text>}
          </View>
        ))}
        {problems.length > 12 && (
          <Text style={styles.subtitle}>
            ...und {problems.length - 12} weitere Punkte im Tool sichtbar.
          </Text>
        )}

        <Text style={styles.sectionTitle}>Schnelle Übersicht</Text>
        <View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>HTTP-Status</Text>
            <Text style={styles.rowValue}>{result.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Ladezeit</Text>
            <Text style={styles.rowValue}>{result.timings.total.toFixed(2)} s</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>TTFB</Text>
            <Text style={styles.rowValue}>{result.timings.ttfb.toFixed(2)} s</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Download</Text>
            <Text style={styles.rowValue}>{Math.round(result.timings.downloadKb)} KB</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Technologien</Text>
            <Text style={styles.rowValue}>{result.tech.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Cookies</Text>
            <Text style={styles.rowValue}>{result.cookies.length}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          SiteScope — Automatisierte Website-Analyse. Dieser Bericht ersetzt keine individuelle
          Fachberatung.
        </Text>
      </Page>
    </Document>
  );
}

export function ReportPDFDownload({ result }: { result: AnalyzeResult }) {
  const date = new Date().toISOString().slice(0, 10);
  const hostname = result.finalUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const [{ url, loading }, update] = usePDF({ document: <ReportDocument result={result} /> });

  const handleClick = () => {
    saveReport(result);
    update(<ReportDocument result={result} />);
    setTimeout(() => {
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `sitescope-bericht-${hostname}-${date}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }, 0);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition disabled:opacity-50"
    >
      <FileDown className="h-3.5 w-3.5" />
      {loading ? "Generiere PDF..." : "PDF-Bericht herunterladen"}
    </button>
  );
}
