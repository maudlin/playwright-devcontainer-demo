/**
 * Convert Playwright step CSV -> manual test case CSV
 * Usage:
 *   node scripts/generate-manual-cases.mjs test-results/manual-tests.csv
 * Output:
 *   test-results/manual-tests.cases.csv
 */
// scripts/generate-manual-cases.mjs (status-aware)
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const [,, inputPathArg] = process.argv;
const inputPath = inputPathArg || "test-results/manual-tests.csv";
const csvIn = fs.readFileSync(inputPath, "utf8");
const rows = parse(csvIn, { columns: true, skip_empty_lines: true, bom: true });

const clean = (s = "") => String(s).replace(/""/g, '"').trim();
const preferManual = r => clean(r["Manual Step (AI)"]) || clean(r["Manual Step"]) || clean(r["Raw Step"]);

function normalizeAction(t = "") {
  let s = clean(t);
  s = s.replace(/^Navigate to\s+"\/"$/i, "Open the home page");
  s = s.replace(
    /^Click getByRole\('([^']+)',\s*\{\s*name:\s*'([^']+)'\s*\}\s*\)$/i,
    (_m, role, name) => `Click the ${role} labeled '${name}'`
  );
  s = s.replace(
    /^(?:Type(?: into)?|Fill)\s+"([^"]+)"\s+getByRole\('([^']+)',\s*\{\s*name:\s*'([^']+)'\s*\}\s*\)$/i,
    (_m, value, role, name) => `Type '${value}' into the ${role} labeled '${name}'`
  );
  return s;
}

const expectedFromAction = (s = "") => {
  const t = s.toLowerCase();
  if (t.startsWith("open the home page")) return "Home page is displayed.";
  if (t.startsWith("navigate to")) return "Target page is displayed.";
  if (t.startsWith("click the link")) return "Linked page opens or navigation begins.";
  if (t.startsWith("click ")) return "Requested action is triggered.";
  if (t.startsWith("type ")) return "Text appears in the field.";
  return "Action completes successfully.";
};

const expectedFromVerify = (line = "") => {
  const low = line.toLowerCase();
  if (low.includes("tohavetitle")) return "The page title is correct.";
  if (low.includes("tohaveurl")) return "The current URL is correct.";
  if (low.includes("tobevisible")) return "The element is visible.";
  if (low.includes("tohavetext")) return "The expected text is displayed.";
  let t = clean(line.replace(/^Verify[.: ]*/i, ""));
  if (t && !/[.?!]$/.test(t)) t += ".";
  return t || "Condition holds.";
};

const describeTest = (name = "") => {
  const parts = name.split(">").map(s => s.trim()).filter(Boolean);
  return parts.at(-1) || clean(name);
};

// group by test name
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
  const prereq = "";

  steps.sort((a, b) => Number(a["Step #"]) - Number(b["Step #"]));

  let lastActionIdx = -1;
  for (const r of steps) {
    const manual = normalizeAction(preferManual(r));
    const status = (clean(r["Test Status"]).toLowerCase() === "passed") ? "Pass"
                 : (clean(r["Test Status"]) ? "Fail" : ""); // treat anything not 'passed' as Fail
    const isVerify = manual.toLowerCase().startsWith("verify ");

    if (isVerify && lastActionIdx >= 0) {
      out[lastActionIdx]["Expected Result"] = expectedFromVerify(manual);
      // keep action's Status as-is (from the test)
      lastActionIdx = -1;
      continue;
    }

    out.push({
      "Test Case ID": testCaseId,
      "Test Description": testDesc,
      "Prerequisites": prereq,
      "Test Step": isVerify ? "(Checkpoint)" : manual,
      "Expected Result": isVerify ? expectedFromVerify(manual) : expectedFromAction(manual),
      "Status": status
    });

    lastActionIdx = isVerify ? -1 : out.length - 1;
  }
}

const outCsv = stringify(out, { header: true });
const outPath = path.join(path.dirname(inputPath), "manual-tests.cases.csv");
fs.writeFileSync(outPath, '\uFEFF' + outCsv, "utf8");
console.log(`Wrote manual test cases - ${outPath}`);
