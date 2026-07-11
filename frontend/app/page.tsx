"use client";

import { useCallback, useMemo, useState } from "react";
import Papa from "papaparse";
import FileDropzone from "@/components/FileDropzone";
import PreviewTable from "@/components/PreviewTable";
import ResultsTable from "@/components/ResultsTable";
import StepIndicator from "@/components/StepIndicator";
import { extractCrmRecords } from "@/lib/api";
import { ExtractResponse, RawRow } from "@/lib/types";

type Stage = "upload" | "preview" | "importing" | "result";

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const step = useMemo(() => {
    if (stage === "upload") return 1;
    if (stage === "preview") return 2;
    if (stage === "importing") return 3;
    return 4;
  }, [stage]);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setFileName(file.name);

    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = results.data.filter((r) => Object.values(r).some((v) => (v ?? "").toString().trim()));
        setHeaders(results.meta.fields || []);
        setRows(parsedRows);
        setStage("preview");
      },
      error: (err) => setError(`Could not read CSV: ${err.message}`),
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setStage("importing");
    setError(null);
    try {
      const data = await extractCrmRecords(rows);
      setResult(data);
      setStage("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong during import.");
      setStage("preview");
    }
  }, [rows]);

  const handleReset = useCallback(() => {
    setStage("upload");
    setFileName(null);
    setHeaders([]);
    setRows([]);
    setResult(null);
    setError(null);
  }, []);

  const handleDownloadCsv = useCallback(() => {
    if (!result) return;
    const csv = Papa.unparse(result.records);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "groweasy-crm-import.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex flex-col items-center gap-6 border-b border-line pb-8 text-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-50 sm:text-4xl">
            <span className="text-accent">GrowEasy</span> CSV Importer
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-mute">
            Any layout in, clean CRM records out. Upload a lead export and the mapper figures out where every field belongs.
          </p>
        </div>
        <StepIndicator current={step} />
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
          {error}
        </div>
      )}

      {stage === "upload" && (
        <section className="mx-auto max-w-2xl">
          <FileDropzone onFile={handleFile} fileName={fileName} />
        </section>
      )}

      {(stage === "preview" || stage === "importing") && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-medium text-slate-100">
                Preview — {rows.length} row{rows.length === 1 ? "" : "s"}
              </h2>
              <p className="text-sm text-mute">
                Raw upload as parsed. Nothing has been sent to the mapper yet.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="rounded-md border border-line px-4 py-2 text-sm text-mute transition-colors hover:border-mute hover:text-slate-200"
              >
                Start over
              </button>
              <button
                onClick={handleConfirm}
                disabled={stage === "importing"}
                className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {stage === "importing" ? "Mapping fields…" : "Confirm import"}
              </button>
            </div>
          </div>
          <PreviewTable headers={headers} rows={rows} />
        </section>
      )}

      {stage === "result" && result && (
        <section className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Rows read" value={result.totalInput} tone="mute" />
            <StatCard label="Imported" value={result.totalImported} tone="good" />
            <StatCard label="Skipped" value={result.totalSkipped} tone="bad" />
            <StatCard label="Model" value={result.model} tone="accent2" isText />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-medium text-slate-100">Mapped CRM records</h2>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="rounded-md border border-line px-4 py-2 text-sm text-mute transition-colors hover:border-mute hover:text-slate-200"
              >
                Import another file
              </button>
              <button
                onClick={handleDownloadCsv}
                disabled={result.records.length === 0}
                className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Download CSV
              </button>
            </div>
          </div>

          <ResultsTable records={result.records} skippedRecords={result.skippedRecords} />

          {result.batchErrors.length > 0 && (
            <div className="rounded-lg border border-accent2/40 bg-accent2/10 px-4 py-3 text-sm text-accent2">
              <p className="mb-2 font-medium">
                {result.batchErrors.length} batch{result.batchErrors.length === 1 ? "" : "es"} failed after
                retry and were counted as skipped:
              </p>
              <ul className="list-disc space-y-1 pl-5 font-mono text-xs">
                {result.batchErrors.map((be, i) => (
                  <li key={i}>
                    rows {be.rowRange[0]}–{be.rowRange[1]}: {be.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
  isText,
}: {
  label: string;
  value: number | string;
  tone: "mute" | "good" | "bad" | "accent2";
  isText?: boolean;
}) {
  const toneClass = {
    mute: "text-slate-200",
    good: "text-accent",
    bad: "text-bad",
    accent2: "text-accent2",
  }[tone];

  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <p className="font-mono text-xs uppercase tracking-wide text-mute">{label}</p>
      <p className={`tabular mt-1 ${isText ? "truncate text-sm" : "text-2xl"} font-display font-bold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
