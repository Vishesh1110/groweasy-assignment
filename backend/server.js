import "dotenv/config";
import express from "express";
import cors from "cors";
import { parseRouter } from "./src/routes/parse.js";
import { extractRouter } from "./src/routes/extract.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", parseRouter);
app.use("/api", extractRouter);


app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`GrowEasy CSV importer backend listening on http://localhost:${port}`);
});