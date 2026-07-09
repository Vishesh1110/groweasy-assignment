"use client";

import { RawRow } from "@/lib/types";

interface Props {
  headers: string[];
  rows: RawRow[];
  maxPreviewRows?: number;
}

export default function PreviewTable({ headers, rows, maxPreviewRows = 50 }: Props) {
  const visible = rows.slice(0, maxPreviewRows);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#1B202B]">
            <tr>
              <th className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs uppercase tracking-wide text-mute">
                #
              </th>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs uppercase tracking-wide text-mute"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i} className="odd:bg-white/[0.015] hover:bg-white/[0.03]">
                <td className="tabular whitespace-nowrap border-b border-line/60 px-3 py-2 text-mute">{i + 1}</td>
                {headers.map((h) => (
                  <td key={h} className="whitespace-nowrap border-b border-line/60 px-3 py-2 text-slate-300">
                    {row[h] || <span className="text-line">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxPreviewRows && (
        <div className="border-t border-line px-3 py-2 text-xs text-mute">
          Showing {maxPreviewRows} of {rows.length} rows. All {rows.length} rows will be sent on import.
        </div>
      )}
    </div>
  );
}
