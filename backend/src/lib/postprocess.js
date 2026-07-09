import { CRM_FIELDS, CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from "./constants.js";

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_RE = /(?:\+?\d[\d\s-]{7,}\d)/g;

function safeString(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\r?\n/g, "\\n").trim();
}

function isValidDate(value) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}


export function validateRecord(raw) {
  const record = {};
  for (const field of CRM_FIELDS) {
    record[field] = safeString(raw[field]);
  }

  if (!CRM_STATUS_VALUES.includes(record.crm_status)) {
    record.crm_status = "";
  }
  if (!DATA_SOURCE_VALUES.includes(record.data_source)) {
    record.data_source = "";
  }

  if (!isValidDate(record.created_at)) {
    record.created_at = "";
  }

  if (!record.email && !record.mobile_without_country_code) {
    return { record, wasSkipped: true, skipReason: "No email or mobile number found" };
  }

  return { record, wasSkipped: false, skipReason: null };
}


export function appendMissedContactsToNote(record, rawRow) {
  const rawText = Object.values(rawRow).map((v) => safeString(v)).join(" | ");
  const foundEmails = [...new Set(rawText.match(EMAIL_RE) || [])];
  const foundPhones = [...new Set((rawText.match(PHONE_RE) || []).map((p) => p.replace(/\s|-/g, "")))];

  const extraEmails = foundEmails.filter((e) => e !== record.email);
  const extraPhones = foundPhones.filter(
    (p) => !p.endsWith(record.mobile_without_country_code || "\u0000")
  );

  const extras = [];
  if (extraEmails.length) extras.push(`Additional email(s): ${extraEmails.join(", ")}`);
  if (extraPhones.length) extras.push(`Additional phone(s): ${extraPhones.join(", ")}`);

  if (extras.length) {
    record.crm_note = [record.crm_note, ...extras].filter(Boolean).join(" | ");
  }
  return record;
}
