import "dotenv/config";
import express from "express";
import cors from "cors";
import { parseRouter } from "./src/routes/parse.js";
import { extractRouter } from "./src/routes/extract.js";

const app = express();

app.use(cors());

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`GrowEasy CSV importer backend listening on http://localhost:${port}`);
});