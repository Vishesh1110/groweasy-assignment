import { Router } from "express";
import { mapBatchWithAI } from "../lib/openrouter.js";
import { validateRecord, appendMissedContactsToNote } from "../lib/postprocess.js";

export const extractRouter = Router();

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

extractRouter.post("/extract", async (req, res) => {
  const { rows } = req.body || {};

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "Body must include a non-empty 'rows' array." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "OPENROUTER_API_KEY is not configured on the server. Add it to backend/.env.",
    });
  }
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
  const batchSize = Number(process.env.BATCH_SIZE) || 15;

  const batches = chunk(rows, batchSize);
  const imported = [];
  const skipped = [];
  const batchErrors = [];

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const offset = b * batchSize;

    try {
      const aiResults = await mapBatchWithAI({ apiKey, model, batch });

      if (!Array.isArray(aiResults)) {
        throw new Error("AI response was not a JSON array");
      }

      for (const aiRecord of aiResults) {
        const sourceIndex =
          typeof aiRecord._source_index === "number" ? aiRecord._source_index : null;
        const rawRow = sourceIndex !== null ? batch[sourceIndex] : null;

        const { record, wasSkipped, skipReason } = validateRecord(aiRecord);

        if (wasSkipped) {
          skipped.push({ reason: skipReason, source: rawRow || aiRecord });
          continue;
        }

        if (rawRow) appendMissedContactsToNote(record, rawRow);
        imported.push(record);
      }

      const returnedIndexes = new Set(
        aiResults
          .map((r) => r._source_index)
          .filter((i) => typeof i === "number")
      );
      batch.forEach((rawRow, i) => {
        if (!returnedIndexes.has(i)) {
          skipped.push({ reason: "Dropped by AI mapping (not returned)", source: rawRow });
        }
      });
    } catch (err) {
      console.error(`[extract] Batch ${b} (rows ${offset}-${offset + batch.length - 1}) failed:`, err);
      batchErrors.push({
        batchIndex: b,
        rowRange: [offset, offset + batch.length - 1],
        error: err.message,
      });

      batch.forEach((rawRow) => {
        skipped.push({ reason: "AI batch failed", source: rawRow });
      });
    }
  }

  res.json({
    totalInput: rows.length,
    totalImported: imported.length,
    totalSkipped: skipped.length,
    records: imported,
    skippedRecords: skipped,
    batchErrors,
    model,
  });
});
