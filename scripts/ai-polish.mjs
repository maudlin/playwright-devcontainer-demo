/**
 * Usage:
 *   LLM_API_KEY=xxx node scripts/ai-polish.mjs test-results/manual-tests.csv
 *
 * Env:
 *   LLM_API_KEY   (required)
 *   LLM_BASE_URL  default https://api.openai.com/v1
 *   LLM_MODEL     default gpt-4o-mini
 */
import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

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

const prompt = `Rewrite each "Manual Step" as a crisp manual test instruction for a human tester.
- Keep it imperative (e.g., "Click the Login button").
- If the Raw Step includes selector-like text (e.g., :has-text("...")), convert that to natural wording with quotes.
- Do not invent steps, only rewrite.
Return a JSON array of strings, same order as input.`;

const items = rows.map(r => ({ raw: r["Raw Step"], manual: r["Manual Step"] }));

const body = {
  model,
  messages: [
    { role: "system", content: "You convert automation steps to concise manual test steps." },
    { role: "user", content: `${prompt}\n\nInput:\n${JSON.stringify(items, null, 2)}` }
  ],
  temperature: 0.2
};

const resp = await fetch(`${base}/chat/completions`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

if (!resp.ok) {
  const text = await resp.text();
  console.error("LLM error:", resp.status, text);
  process.exit(1);
}

const data = await resp.json();
const content = data.choices?.[0]?.message?.content?.trim();
let rewritten;
try {
  rewritten = JSON.parse(content);
} catch {
  console.error("Could not parse LLM output as JSON array:", content);
  process.exit(1);
}

const outRows = rows.map((r, i) => ({
  ...r,
  "Manual Step (AI)": rewritten[i] || r["Manual Step"]
}));

const outCsv = stringify(outRows, { header: true });
const outPath = inputPath.replace(/\.csv$/, ".polished.csv");
fs.writeFileSync(outPath, outCsv, "utf8");
console.log(`Wrote polished CSV â†’ ${outPath}`);
