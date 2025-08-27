// manual-csv-reporter.cjs (add status)
const fs = require("node:fs");
const path = require("node:path");

function csvEscape(s) { return `"${String(s).replace(/"/g, '""')}"`; }

function toPlainEnglish(raw, category) {
  let t = String(raw || "").trim();
  t = t.replace(/^pw:\s*api\s*/i, "").trim();
  if (/^goto /i.test(t)) return t.replace(/^goto /i, "Navigate to ");
  if (/^click /i.test(t)) return t.replace(/^click /i, "Click ");
  if (/^fill /i.test(t)) return t.replace(/^fill /i, "Type into ");
  if (/^press /i.test(t)) return t.replace(/^press /i, "Press ");
  if (/^Navigate to\s+"\/"$/i.test(t)) return "Open the home page";
  if (category === "expect" || /^expect/i.test(t)) return `Verify ${t.replace(/^expect[.: ]*/i, "")}`;
  if (category === "test.step") return t;
  return t;
}

class ManualCsvReporter {
  constructor() {
    this.rows = [];
    this.current = new Map(); // test.id -> rows[]
  }

  onTestBegin(test) {
    this.current.set(test.id, []);
  }

  onStepEnd(test, _result, step) {
    const noisy = /^(Launch browser|Create context|Create page|Close (context|browser))$/i;
    if (noisy.test(step.title || "")) return;
    const include = ["pw:api", "expect", "test.step"].includes(step.category || "pw:api");
    if (!include) return;
    const bucket = this.current.get(test.id);
    if (!bucket) return;
    const raw = step.title || "";
    bucket.push({
      testTitle: test.titlePath().join(" > "),
      stepIndex: bucket.length + 1,
      rawStep: raw,
      manualStep: toPlainEnglish(raw, step.category),
      category: step.category || "",
      testStatus: "" // to be filled onTestEnd
    });
  }

  onTestEnd(test, result) {
    const bucket = this.current.get(test.id) || [];
    const status = result.status || "";
    for (const r of bucket) r.testStatus = status;
    this.rows.push(...bucket);
    this.current.delete(test.id);
  }

  async onEnd() {
    const outDir = path.join("test-results");
    fs.mkdirSync(outDir, { recursive: true });
    const csvPath = path.join(outDir, "manual-tests.csv");
    const header = ["Test Name","Step #","Raw Step","Manual Step","Category","Test Status"].map(csvEscape).join(",");
    const lines = this.rows.map(r =>
      [r.testTitle, String(r.stepIndex), r.rawStep, r.manualStep, r.category, r.testStatus].map(csvEscape).join(",")
    );
    fs.writeFileSync(csvPath, '\uFEFF' + [header, ...lines].join("\n"), "utf8");
    console.log(`\nWrote ${this.rows.length} step(s) to ${csvPath}`);
  }

  printsToStdio() { return false; }
}

module.exports = ManualCsvReporter;
