# Smart Manual Test Generation — Professional specs from browser automation

> **Transform your Playwright tests into manual test specifications that will wow your QA team**

## What you get (from a single command)
- **🎬 Recorded automation**: Faithful browser recording you can watch, tweak, and rerun
- **🚀 Living E2E tests**: Playwright automation that developers run in CI on every commit  
- **📋 Professional test specs**: Excel-ready CSV with Test Case IDs, descriptions, priorities, and business-friendly language
- **🎯 Context-aware generation**: Smart detection of API vs Web tests, domain extraction, and business flow understanding
- **✅ Ready-to-execute**: Clear manual steps with specific expected results that testers can follow immediately

## Why it’s faster for you
- Record once - publish twice. One walkthrough produces both automation and a manual script—no retyping selectors or steps.
- Assertions auto-pair with actions. “Verify …” lines match the previous action, giving you an instant Expected Result column.
- Readable locators, less flakiness. Recorder prefers getByRole/labels that align with UI copy and survive CSS churn.
- Versioned test assets. Steps live in git next to product code: diffable, reviewable, traceable to requirements.
- Fewer back-and-forths. Failures come with time-travel snapshots and traces—less “can you repro?” ping-pong.

## The 3-minute workflow (simplified!)
1. **Record** (headed Chromium): Click through the flow as you normally would
2. **Enhance** (optional): Add `test.step('Human sentence', …)` around key actions for better manual step descriptions
3. **Generate**: Run `npm run manual:smart` to create professional manual test specifications

### Enhanced AI workflow (5 minutes)
1. **Set API key**: `$env:LLM_API_KEY = "your-openai-key"`
2. **Record & generate**: `npm run manual:smart` 
3. **Review**: Open `test-results/manual-tests.enhanced.csv` in Excel
4. **Share**: Import into TestRail, Xray, or share directly with manual testers

### What the smart generator creates:
- **Test Case ID**: Professional numbering (TC-0001, TC-0002, etc.)
- **Business titles**: "Contact Page Navigation" not "test > Edge > e2e\simplify-brochure.spec.ts"
- **Context descriptions**: "Tests user interactions on Simplify Website, verifying page functionality"
- **Smart prerequisites**: "Access to Simplify Website (https://www.simplify.co.uk/)"
- **Priority classification**: High/Medium/Low based on test content
- **Human-friendly steps**: "Click the Accept button for cookie consent" not "click getByRole('button', { name: 'Accept' })"
- **Meaningful expected results**: "Expected text content is shown" not "toContainText"

## Where it shines (concrete use cases)
- Smoke/regression packs: Record once, PR into the suite, and you’ve got both automated guards and printable checklists.
- UI copy changes: Update one test.step sentence; your automation and manual script stay in sync.
- Bug reports with evidence: Re-run the failing spec, attach the trace/snapshots plus the CSV steps—devs see exactly what you did.

## Pro tips for high-quality artefacts
- Write the narrative in test.step. That text becomes your manual steps verbatim.
- Assert the user-visible outcome. Prefer toHaveText, toBeVisible, toHaveURL—they map cleanly to Expected Result.
- Stabilise test data. Seed or use a dedicated account so manual and automated runs see the same state.
- Tag for traceability. Use test.describe titles or annotations to carry requirement IDs into exports.
- Chromium-only for speed. Record in Chromium; add Firefox/WebKit later in CI if cross-engine coverage matters.

## Before vs After: The Smart Generation Difference

### ❌ Traditional Manual Test Creation
```
Test: test > Edge > e2e\simplify-brochure.spec.ts > test
Step 1: goto "https://www.simplify.co.uk/"
Step 2: click getByRole('button', { name: 'Accept' })
Step 3: expect(page.getByRole('contentinfo')).toContainText(...)
```
*Manual testers think: "What is this? How do I execute this?"*

### ✅ Smart Generated Manual Test Specification
```
Test Case ID: TC-0001
Title: Contact Page Navigation  
Description: Tests user interactions on Simplify Website, verifying page functionality and user experience
Priority: Medium
Prerequisites: Access to Simplify Website (https://www.simplify.co.uk/)

Step 1: Navigate to the Simplify website
        Expected Result: Page loads successfully and displays expected content

Step 2: Click the Accept button for cookie consent
        Expected Result: Button responds to click and cookie banner disappears

Step 3: Verify the footer displays company legal information
        Expected Result: Legal disclaimer text is visible in the footer section
```
*Manual testers think: "Perfect! I know exactly what to test and what to expect."*

## What stays manual (and valuable)
Exploratory testing, edge-case probing, and usability judgement don't get "automated away." This setup removes the transcription and duplication between your walkthrough, your written script, and the regression suite—so you spend more time testing and less time typing.
