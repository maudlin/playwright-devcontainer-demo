/**
 * One-shot builder:
 * 1) Run Playwright tests (with CSV reporter)
 * 2) If LLM_API_KEY set, polish the CSV with AI
 * 3) Generate classic manual test cases CSV
 *
 * Usage:
 *   npm run manual:build
 *   # or pass Playwright args:
 *   npm run manual:build -- tests/api/cat-facts.spec.ts --project=chromium
 *
 * Env:
 *   LLM_API_KEY   (optional) enable AI polish when set
 *   LLM_BASE_URL  (optional) default https://api.openai.com/v1
 *   LLM_MODEL     (optional) default gpt-4o-mini
 *   DEBUG_POLISH  (optional) "1" to log LLM previews
 */
// scripts/build-manual-spec.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const passArgs = process.argv.slice(2);
const outDir = "test-results";
const baseCsv = path.join(outDir, "manual-tests.csv");
const polishedCsv = baseCsv.replace(/\.csv$/, ".polished.csv");
const casesCsv = path.join(outDir, "manual-tests.cases.csv");

function runCaptureExit(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...opts
    });
    p.on("exit", (code) => resolve(code ?? 0));
  });
}

async function main() {
  console.log("\n▶ Running Playwright tests + CSV export…\n");
  const code = await runCaptureExit("npx", ["playwright", "test", ...passArgs, "--reporter=list,./manual-csv-reporter.cjs"]);

  if (!fs.existsSync(baseCsv)) {
    console.error(`\n❌ Expected CSV not found: ${baseCsv}`);
    process.exit(1);
  }
  if (code !== 0) {
    console.warn("\n⚠️  Some tests failed, continuing to build manual spec from available results…");
  }

  const useAI = !!process.env.LLM_API_KEY;
  if (useAI) {
    console.log("\n▶ Polishing manual steps with AI…\n");
    const aiCode = await runCaptureExit("node", ["scripts/ai-polish.mjs", baseCsv], { env: process.env });
    if (aiCode !== 0) console.warn("⚠️  AI polish step failed; continuing with raw CSV.");
  } else {
    console.log("\nℹ️  Skipping AI polish (set LLM_API_KEY to enable).");
  }

  const inputForCases = useAI && fs.existsSync(polishedCsv) ? polishedCsv : baseCsv;

  console.log("\n▶ Generating manual test cases CSV…\n");
  const casesCode = await runCaptureExit("node", ["scripts/generate-manual-cases.mjs", inputForCases]);
  if (casesCode !== 0 || !fs.existsSync(casesCsv)) {
    console.error(`\n❌ Manual cases CSV not created: ${casesCsv}`);
    process.exit(1);
  }

  console.log(`\n✅ Manual spec ready - ${casesCsv}`);
  console.log(`   (Source: ${path.basename(inputForCases)})\n`);
  process.exit(code); // propagate overall success/failure if you want CI to fail when tests fail
}

main();
