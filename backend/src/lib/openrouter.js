import { CRM_FIELDS, CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from "./constants.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function buildSystemPrompt() {
  return `You are a data-mapping engine for a real-estate CRM called GrowEasy.

You will be given an array of raw lead records extracted from a CSV file. The CSV
may come from Facebook Lead Ads, Google Ads, Excel sheets, other CRMs, marketing
agencies, or manually built spreadsheets. Column names, order, and layout are
NOT fixed and will vary between uploads.

Your job: map each raw record's fields onto this exact CRM schema, using your
understanding of what each source column likely represents (e.g. "Full Name",
"contact name", "lead_name" all mean the person's name; "Phone", "Mobile No.",
"contact_number" all mean a phone number).

CRM schema (return exactly these keys, in this order, for every record), PLUS
one extra bookkeeping key "_source_index":
${CRM_FIELDS.map((f) => `- ${f}`).join("\n")}
- _source_index (the 0-based position of this record in the INPUT array you
  were given, so the caller can match your output back to the original row)

Rules you MUST follow:

1. crm_status: only ever one of ${JSON.stringify(CRM_STATUS_VALUES)}, or "" if
   nothing in the record maps confidently to one of these.
2. data_source: only ever one of ${JSON.stringify(DATA_SOURCE_VALUES)}, or ""
   if nothing maps confidently.
3. created_at: normalize to a string parseable by JavaScript's new Date(x),
   ideally "YYYY-MM-DD HH:mm:ss" or ISO 8601. If no date is present, use "".
4. crm_note: put remarks, follow-up notes, additional comments, any extra
   phone numbers or email addresses beyond the first one found, and any
   other useful info from the source row that doesn't fit a schema field.
5. If a record has more than one email: put the first in "email", append the
   rest into crm_note (clearly labeled, e.g. "Additional email: x@y.com").
   Same rule for phone numbers with "mobile_without_country_code".
6. Never output raw newlines inside any field value — use "\\n" if a line
   break is truly needed, since every record must remain a single CSV row.
7. If a record has NEITHER an email NOR a mobile number anywhere in its
   source data, omit it entirely from your output (do not include a stub).
8. country_code should be a phone country code like "+91" if you can infer
   one (e.g. from a 10-digit Indian number or explicit country field),
   otherwise "".
9. Never invent data that is not present or reasonably inferable in the
   source row. Leave a field "" rather than guessing.

Output format: respond with ONLY a raw JSON array of objects, one object per
input record that survives rule 7, each object containing exactly the schema
keys as strings. No markdown fences, no commentary, no explanation text.`;
}

function extractJsonArray(text) {

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return JSON.parse(cleaned);
}

async function callOpenRouterOnce({ apiKey, model, batch }) {

  const maxTokens = Math.min(8000, 400 + batch.length * 350);

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "groweasy-csv-importer",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: `Raw records (JSON array, one object per CSV row, keys are the ORIGINAL source column headers):\n\n${JSON.stringify(
            batch
          )}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter request failed (${res.status}): ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  if (!content) {
    throw new Error(
      `OpenRouter response had no message content. finish_reason=${choice?.finish_reason}, raw=${JSON.stringify(data).slice(0, 300)}`
    );
  }

  try {
    return extractJsonArray(content);
  } catch (parseErr) {
    throw new Error(
      `Could not parse AI response as JSON (finish_reason=${choice?.finish_reason}): ${parseErr.message}. Content started with: ${content.slice(0, 200)}`
    );
  }
}


export async function mapBatchWithAI({ apiKey, model, batch }) {
  try {
    return await callOpenRouterOnce({ apiKey, model, batch });
  } catch (firstError) {
    try {
      return await callOpenRouterOnce({ apiKey, model, batch });
    } catch (secondError) {
      throw new Error(
        `AI extraction failed after retry: ${secondError.message} (first attempt: ${firstError.message})`
      );
    }
  }
}
