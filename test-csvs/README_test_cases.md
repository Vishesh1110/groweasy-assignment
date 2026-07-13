# Test CSVs — what each one is checking


- **03, 04** use three different real-world export layouts with
  unrelated column names — use these to verify the *AI field mapping* itself.

Upload each one separately through the UI (or POST to `/api/extract`).

---

## 03_google_ads_leads_export.csv — 5 rows

Mimics a Google Ads lead form export. Row `GA-9002` has two phone numbers
separated by `/` in one field — checks the "extra number → `crm_note`" rule
works even with non-comma separators. Row `GA-9003` has **no name, no
email, no phone at all** — this is the one row that should be **skipped**.
Row `GA-9004`'s comment says "status closed won" in free text with no
structured status column — good test of whether the mapper infers
`SALE_DONE` from context or leaves it blank.

Expect: **4 imported, 1 skipped** (GA-9003).

## 04_realestate_crm_export.csv — 6 rows

Mimics another CRM's export with completely different vocabulary for lead
status: `Hot Lead`, `Follow Up`, `Not Interested`, `Closed Won`, `Not
Connected`, `New`. This is the real test of the AI's semantic mapping to
the four fixed enum values — a keyword/exact-match approach would fail here
by design; only genuine semantic understanding maps `"Closed Won"` →
`SALE_DONE` or `"Hot Lead"` → `GOOD_LEAD_FOLLOW_UP` correctly.

Row `RE-5004` has no `Customer Name`. Row `RE-5006` has an invalid date
(`32-13-2026`, month 13 doesn't exist) — `created_at` should blank out but
the row stays (has email + mobile). No row in this file should be skipped
(every row has at least one contact field).

Expect: **6 imported, 0 skipped**.
