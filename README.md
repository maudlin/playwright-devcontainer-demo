# Playwright in a Dev Container (record → run → export CSV → AI polish)

## Quick start (VS Code)

1. **Clone this repo** and open it in VS Code.
2. When prompted, click **Reopen in Container** (or run: > Dev Containers: Reopen in Container).
3. Wait for post-create to run:
   - `npm install`
   - `npx playwright install --with-deps`
4. Run a demo test:
   - Terminal: `npm test`
   - Or UI Mode: `npm run test:ui`
5. Export manual-test CSV:
   - `npm run csv`
   - See `test-results/manual-tests.csv`
6. (Optional) AI polish:
   - `LLM_API_KEY=your_key npm run ai:polish`
   - Produces `test-results/manual-tests.polished.csv`

## Recording a test (two options)

- **VS Code extension**  
  Open the **Playwright** view (left Activity Bar) → **Record New** → point to your app and click around. It will create a `*.spec.ts`.

- **CLI**  
  `npm run record -- https://example.com`  
  When you save and close codegen, it writes a spec.

> Tip: Wrap logical actions with `test.step('human-friendly step', async () => { ... })` to control the prose that appears in the CSV.

## CSV export details

The custom reporter captures user-visible actions/expectations:
- Categories included: Playwright API steps (`pw:api`), `expect` assertions, and your `test.step` blocks.
- Output columns: `Test Name, Step #, Raw Step, Manual Step, Category`
- The **Manual Step** column lightly normalizes common verbs (`goto` → `Navigate to`, `click` → `Click`, `expect` → `Verify ...`).

## AI polishing

`scripts/ai-polish.mjs` accepts the CSV and asks any OpenAI-compatible endpoint to rewrite “Manual Step” into friendlier English.  
Environment:
- `LLM_API_KEY` (required)
- `LLM_BASE_URL` (optional, defaults to `https://api.openai.com/v1`)
- `LLM_MODEL` (optional, defaults to `gpt-4o-mini`)

Example:
```bash
LLM_API_KEY=sk-... npm run ai:polish
