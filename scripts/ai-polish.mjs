/**
 * Usage:
 *   LLM_API_KEY=xxx node scripts/ai-polish.mjs test-results/manual-tests.csv
 * Env:
 *   LLM_API_KEY   (required)
 *   LLM_BASE_URL  default https://api.openai.com/v1
 *   LLM_MODEL     default gpt-4o-mini
 *   DEBUG_POLISH  set to "1" to log request/response previews
 */
import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const DEBUG = process.env.DEBUG_POLISH === "1";
const [,, inputPath] = process.argv;
if (!inputPath) {
  console.error("Provide CSV path, e.g. node scripts/ai-polish.mjs test-results/manual-tests.csv");
  process.exit(1);
}
const apiKey = process.env.LLM_API_KEY;
if (!apiKey) {
  console.error("Missing LLM_API_KEY");
  process.exit(1);
}
const base = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const model = process.env.LLM_MODEL || "gpt-4o-mini";

const csv = fs.readFileSync(inputPath, "utf8");
const rows = parse(csv, { columns: true, skip_empty_lines: true });

const items = rows.map(r => ({ raw: r["Raw Step"] ?? "", manual: r["Manual Step"] ?? "", category: r["Category"] ?? "" }));

const prompt = `Rewrite each "Manual Step" as a crisp, human-friendly manual test step.
Rules:
- Always be imperative: "Open...", "Click...", "Verify...".
- Prefer human terms: "/" -> "the home page"; "toHaveTitle" -> "the page title is correct".
- If the current text is already fine, keep it (don't add fluff).
- Do NOT invent new steps or data. Keep the same meaning.
Return a JSON array of strings, same order as input. No code fences, no prose.`;

const body = {
  model,
  messages: [
    { role: "system", content: "You ONLY return a JSON array of rewritten steps. No prose. No code fences." },
    { role: "user", content: `${prompt}\n\nInput:\n${JSON.stringify(items, null, 2)}` }
  ],
  temperature: 0.2
};

if (DEBUG) console.error("LLM request preview:", JSON.stringify({ model, base, count: items.length }).slice(0,200));

const t0 = Date.now();
const resp = await fetch(`${base}/chat/completions`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
const dt = Date.now() - t0;

if (!resp.ok) {
  const text = await resp.text();
  console.error("LLM error:", resp.status, text);
  process.exit(1);
}

const data = await resp.json();
let content = data.choices?.[0]?.message?.content?.trim() || "";

function extractJsonArray(text) {
  let s = text.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/,"").trim();
  try { return JSON.parse(s); } catch {}
  const first = s.indexOf("["), last = s.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) {
    return JSON.parse(s.slice(first, last + 1));
  }
  throw new Error(`Could not parse LLM output as JSON array:\n${text}`);
}

let rewritten;
try {
  rewritten = extractJsonArray(content);
} catch (e) {
  console.error(String(e));
  process.exit(1);
}

if (DEBUG) {
  console.error(`LLM latency: ${dt}ms`);
  console.error("LLM content preview:", content.slice(0, 400));
}

// Fallback: if most outputs equal inputs, apply tiny rule-based nudges
function rulePolish(s) {
  let t = String(s).trim();
  t = t.replace(/^Navigate to\s+"\/"$/i, "Open the home page");
  t = t.replace(/^Verify\s+"toHaveTitle"$/i, "Verify the page title is correct");
  t = t.replace(/^Verify\s+"toHaveURL"$/i, "Verify the current URL is correct");
  t = t.replace(/^Navigate to\s+iana\.org$/i, "Navigate to IANA");
  // Normalize double-double-quotes → single double-quotes
  t = t.replace(/""/g, '"');
  return t;
}

const sameCount = Math.min(rewritten.length, items.length)
  ? items.slice(0, rewritten.length).filter((it, i) => (it.manual || "") === (rewritten[i] || "")).length
  : 0;

if (sameCount >= Math.floor(items.length * 0.7)) {
  // Apply gentle rule-based polishing where helpful
  rewritten = items.map((it, i) => rulePolish(rewritten[i] ?? it.manual ?? ""));
}

const outRows = rows.map((r, i) => ({
  ...r,
  "Manual Step (AI)": rewritten[i] || r["Manual Step"]
}));

const outCsv = stringify(outRows, { header: true });
const outPath = inputPath.replace(/\.csv$/, ".polished.csv");
fs.writeFileSync(outPath, outCsv, "utf8");
console.log(`Wrote polished CSV → ${outPath}`);
