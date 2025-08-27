/**
 * Convert Playwright step CSV -> manual test case CSV
 * Usage:
 *   node scripts/generate-manual-cases.mjs test-results/manual-tests.csv
 * Output:
 *   test-results/manual-tests.cases.csv
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const [,, inputPathArg] = process.argv;
const inputPath = inputPathArg || "test-results/manual-tests.csv";
const csvIn = fs.readFileSync(inputPath, "utf8");
const rows = parse(csvIn, { columns: true, skip_empty_lines: true });

const clean = (s = "") => String(s).replace(/""/g, '"').trim();

function preferManual(r) {
  // Prefer AI column, then manual, then raw
  const ai = clean(r["Manual Step (AI)"]);
  if (ai) return ai;
  const m = clean(r["Manual Step"]);
  if (m) return m;
  return clean(r["Raw Step"]);
}

function normalizeAction(text = "") {
  let t = clean(text);

  // Friendly route/home wording
  t = t.replace(/^Navigate to\s+"\/"$/i, "Open the home page");

  // Click getByRole('role', { name: 'Label' })
  t = t.replace(
    /^Click getByRole\('([^']+)',\s*\{\s*name:\s*'([^']+)'\s*\}\s*\)$/i,
    (_m, role, name) => `Click the ${role} labeled '${name}'`
  );

  // Type/Fill "value" getByRole('role', { name: 'Label' })
  t = t.replace(
    /^(?:Type(?: into)?|Fill)\s+"([^"]+)"\s+getByRole\('([^']+)',\s*\{\s*name:\s*'([^']+)'\s*\}\s*\)$/i,
    (_m, value, role, name) => `Type '${value}' into the ${role} labeled '${name}'`
  );

  // Tidy quotes
  t = t.replace(/""/g, '"');
  return t;
}

function expectedFromAction(step = "") {
  const s = step.toLowerCase();
  if (s.startsWith("open the home page")) return "Home page is displayed.";
  if (s.startsWith("navigate to")) return "Target page is displayed.";
  if (s.startsWith("click the link")) return "Linked page opens or navigation begins.";
  if (s.startsWith("click ")) return "Requested action is triggered.";
  if (s.startsWith("type ")) return "Text appears in the field.";
  if (s.startsWith("press ")) return "Key press is accepted.";
  if (s.startsWith("select ")) return "Option is selected.";
  return "Action completes successfully.";
}

function expectedFromVerify(line = "") {
  const low = line.toLowerCase();
  if (low.includes("tohavetitle")) return "The page title is correct.";
  if (low.includes("tohaveurl")) return "The current URL is correct.";
  if (low.includes("tobevisible")) return "The element is visible.";
  if (low.includes("tohavetext")) return "The expected text is displayed.";
  if (low.includes("tobeenabled")) return "The control is enabled.";
  // Generic fallback: strip "Verify " and use remainder as sentence
  let t = clean(line.replace(/^Verify[.: ]*/i, ""));
  if (t && !/[.?!]$/.test(t)) t += ".";
  return t || "Condition holds.";
}

function describeTest(testName = "") {
  // " > chromium > file.spec.ts > Title" -> "Title"
  const parts = testName.split(">").map(s => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || clean(testName);
}

// Group rows by Test Name
const groups = new Map();
for (const r of rows) {
  const key = clean(r["Test Name"]);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

const out = [];
let tcCounter = 0;

for (const [testName, steps] of groups.entries()) {
  tcCounter += 1;
  const testCaseId = `TC-${String(tcCounter).padStart(4, "0")}`;
  const testDesc = describeTest(testName);
  const prereq = ""; // add defaults here if you want (e.g., "User is signed in")

  steps.sort((a, b) => Number(a["Step #"]) - Number(b["Step #"]));

  let lastActionIdx = -1;

  for (const r of steps) {
    const manual = normalizeAction(preferManual(r));
    const category = (r["Category"] || "").toLowerCase();
    const isVerify = manual.toLowerCase().startsWith("verify ");

    if (isVerify && lastActionIdx >= 0) {
      // Pair this verify with the previous action
      out[lastActionIdx]["Expected Result"] = expectedFromVerify(manual);
      lastActionIdx = -1;
      continue;
    }

    // New row for actions OR standalone verifies
    const row = {
      "Test Case ID": testCaseId,
      "Test Description": testDesc,
      "Prerequisites": prereq,
      "Test Step": isVerify ? "(Checkpoint)" : manual,
      "Expected Result": isVerify ? expectedFromVerify(manual) : expectedFromAction(manual),
      "Status": ""
    };
    out.push(row);

    lastActionIdx = isVerify ? -1 : out.length - 1;
  }
}

const outCsv = stringify(out, { header: true });
const outPath = path.join(path.dirname(inputPath), "manual-tests.cases.csv");
fs.writeFileSync(outPath, outCsv, "utf8");
console.log(`Wrote manual test cases → ${outPath}`);
