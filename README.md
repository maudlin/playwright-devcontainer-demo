# Smart Manual Test Generator - Playwright Edition

> **Record once, test twice**: Transform Playwright browser automation into professional manual test specifications that will wow your QA team.

## ✨ Quick Start

1. **Clone this repo** and open it in VS Code
2. When prompted, click **Reopen in Container** (or run: > Dev Containers: Reopen in Container)
3. Wait for setup to complete:
   - `npm install`
   - `npx playwright install --with-deps`
4. **Run tests and generate manual specs** (recommended):
   ```bash
   npm run manual:smart
   ```
   - Runs all tests
   - Creates `test-results/manual-tests.manual-specs.csv`
   - **Excel-ready** with professional test case format

5. **Optional: Enhanced AI generation**:
   ```powershell
   $env:LLM_API_KEY = "your-openai-key"
   npm run manual:smart
   ```

## Recording a test (two options)

- **VS Code extension**  
  Open the **Playwright** view (left Activity Bar) - **Record New** - point to your app and click around. It will create a `*.spec.ts`.

- **CLI**  
  `npm run record -- https://example.com`  
  When you save and close codegen, it writes a spec.

> Tip: Wrap logical actions with `test.step('human-friendly step', async () => { ... })` to control the prose that appears in the CSV.

## CSV export details

The custom reporter captures user-visible actions/expectations:
- Categories included: Playwright API steps (`pw:api`), `expect` assertions, and your `test.step` blocks.
- Output columns: `Test Name, Step #, Raw Step, Manual Step, Category`
- The **Manual Step** column lightly normalizes common verbs (`goto` - `Navigate to`, `click` - `Click`, `expect` - `Verify ...`).

## 🎯 Smart Manual Test Generation

The **star feature** - transforms Playwright tests into professional manual test specifications:

### What You Get:
- **📋 Professional Format**: Test Case ID, Title, Description, Prerequisites, Priority
- **🎨 Business Language**: "Navigate to Simplify website" not "goto 'https://...'" 
- **🧠 Context Awareness**: Detects API vs Web tests, extracts domains, understands flows
- **📊 Excel Ready**: BOM-encoded CSV that opens perfectly in Excel/Sheets
- **✅ Ready to Execute**: Clear steps and expected results for manual testers

### Commands:
```bash
# Smart generation (rule-based, works without API key)
npm run manual:smart

# Enhanced with AI (requires OpenAI-compatible API)
$env:LLM_API_KEY = "your-key"
npm run manual:smart

# Just the CSV export (legacy)
npm run csv
```

### Environment Variables:
- `LLM_API_KEY` (optional) - OpenAI-compatible API key for enhanced generation
- `LLM_BASE_URL` (optional) - defaults to `https://api.openai.com/v1`
- `LLM_MODEL` (optional) - defaults to `gpt-4o-mini`
- `DEBUG_MANUAL` (optional) - set to "1" for detailed logging

### Sample Output

From a simple Playwright test like:
```javascript
test('Contact page navigation', async ({ page }) => {
  await page.goto('https://www.simplify.co.uk/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: 'Contact Us' }).click();
  await expect(page.getByRole('main')).toContainText('New & existing customers');
});
```

You get a professional manual test specification:

| Test Case ID | Test Title | Description | Priority | Step # | Test Step | Expected Result |
|--------------|------------|-------------|----------|--------|-----------|------------------|
| TC-0001 | Contact Page Navigation | Tests user interactions on Simplify Website, verifying page functionality and user experience | Medium | 1 | Navigate to the Simplify website | Page loads successfully and displays expected content |
| TC-0001 |  |  |  | 2 | Click the Accept button for cookie consent | Button responds to click and appropriate action occurs |
| TC-0001 |  |  |  | 3 | Click the Contact Us link in navigation | Page loads successfully and displays expected content |
| TC-0001 |  |  |  | 4 | Verify the main content shows "New & existing customers" | Expected text content is shown |

## 📖 Documentation

- **[Manual Tester Quick Start](docs/manual-tester-quickstart.md)** - Perfect guide for manual testers who want to use the generated specs
- **[User Guide](docs/user-guide.md)** - Complete workflow guide for developers and QA teams

## Available Commands

```bash
# Main command - smart manual test generation
npm run manual:smart

# Standard Playwright commands
npm test                    # Run all tests
npm run test:ui             # Run tests in UI mode
npm run record              # Record new test with codegen

# Legacy: Just export raw CSV (without smart processing)
npm run csv
