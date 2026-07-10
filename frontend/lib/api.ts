import { ExtractResponse, RawRow } from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/+$/, "");

export async function extractCrmRecords(rows: RawRow[]): Promise<ExtractResponse> {
  const res = await fetch(`${API_BASE}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Extraction failed with status ${res.status}`);
  }
  return data as ExtractResponse;
}
