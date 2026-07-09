import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
export const parseRouter = Router();

parseRouter.post("/parse", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Attach it under field name 'file'." });
  }

  try {
    const text = req.file.buffer.toString("utf-8");
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });
    const headers = rows.length ? Object.keys(rows[0]) : [];
    res.json({ headers, rows, rowCount: rows.length });
  } catch (err) {
    res.status(400).json({ error: `Could not parse CSV: ${err.message}` });
  }
});
