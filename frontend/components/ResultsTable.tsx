"use client";

import { useState } from "react";
import { CRM_FIELD_ORDER, CrmRecord, SkippedRecord } from "@/lib/types";

interface Props {
  records: CrmRecord[];
  skippedRecords: SkippedRecord[];
}

const STATUS_COLOR: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "text-accent",
  SALE_DONE: "text-accent",
  DID_NOT_CONNECT: "text-accent2",
  BAD_LEAD: "text-bad",
};

export default function ResultsTable({ records, skippedRecords }: Props) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");

  return (
    <div className="rounded-lg border border-line bg-panel">
      <div className="flex border-b border-line">
        <button
          onClick={() => setTab("imported")}
          className={`px-4 py-3 font-mono text-xs uppercase tracking-wide transition-colors ${
            tab === "imported" ? "border-b-2 border-accent text-accent" : "text-mute hover:text-slate-300"
          }`}
        >
          Imported ({records.length})
        </button>
        <button
          onClick={() => setTab("skipped")}
          className={`px-4 py-3 font-mono text-xs uppercase tracking-wide transition-colors ${
            tab === "skipped" ? "border-b-2 border-bad text-bad" : "text-mute hover:text-slate-300"
          }`}
        >
          Skipped ({skippedRecords.length})
        </button>
      </div>

      <div className="max-h-[480px] overflow-auto">
        {tab === "imported" ? (
          records.length === 0 ? (
            <EmptyState label="No records were successfully mapped." />
          ) : (
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#1B202B]">
                <tr>
                  <th className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs uppercase tracking-wide text-mute">
                    #
                  </th>
                  {CRM_FIELD_ORDER.map((f) => (
                    <th
                      key={f}
                      className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs uppercase tracking-wide text-mute"
                    >
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="odd:bg-white/[0.015] hover:bg-white/[0.03]">
                    <td className="tabular whitespace-nowrap border-b border-line/60 px-3 py-2 text-mute">{i + 1}</td>
                    {CRM_FIELD_ORDER.map((f) => (
                      <td
                        key={f}
                        className={`whitespace-nowrap border-b border-line/60 px-3 py-2 ${
                          f === "crm_status" ? STATUS_COLOR[r[f]] || "text-slate-300" : "text-slate-300"
                        }`}
                      >
                        {r[f] || <span className="text-line">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : skippedRecords.length === 0 ? (
          <EmptyState label="Nothing was skipped. Every row had an email or mobile number." />
        ) : (
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#1B202B]">
              <tr>
                <th className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs uppercase tracking-wide text-mute">
                  #
                </th>
                <th className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs uppercase tracking-wide text-mute">
                  Reason
                </th>
                <th className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs uppercase tracking-wide text-mute">
                  Source row
                </th>
              </tr>
            </thead>
            <tbody>
              {skippedRecords.map((s, i) => (
                <tr key={i} className="odd:bg-white/[0.015] hover:bg-white/[0.03]">
                  <td className="tabular whitespace-nowrap border-b border-line/60 px-3 py-2 text-mute">{i + 1}</td>
                  <td className="whitespace-nowrap border-b border-line/60 px-3 py-2 text-bad">{s.reason}</td>
                  <td className="border-b border-line/60 px-3 py-2 text-slate-400">
                    {JSON.stringify(s.source)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="px-4 py-10 text-center text-sm text-mute">{label}</div>;
}
