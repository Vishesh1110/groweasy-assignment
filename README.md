# GrowEasy CSV Importer

Upload any lead export (Facebook Lead Ads, Google Ads, Excel, another CRM, whatever) and get back clean GrowEasy CRM records — regardless of the order of the attributes.

No database. Everything is processed in-memory per request.

# How it works

1. **Upload** — drag & drop or pick a `.csv` file. Parsed client-side with
   PapaParse purely for the preview; nothing hits the backend yet.
2. **Preview** — a scrollable, sticky-header table of the raw rows exactly as
   uploaded.
3. **Confirm** — only on click does the frontend POST the parsed rows to
   `POST /api/extract`.
4. **Result** — the backend batches rows to an LLM (via OpenRouter) that maps
   arbitrary source columns onto the fixed GrowEasy schema, then the backend
   re-validates every field in code (enum values, date parseability, the
   email/mobile skip rule) before returning imported vs. skipped records.

