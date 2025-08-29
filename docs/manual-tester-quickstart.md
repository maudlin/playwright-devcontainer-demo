# 🎯 Manual Tester Quick Start Guide

> **Get professional manual test specifications from Playwright automation in minutes**

## What You Get

**Input**: Browser automation (Playwright test)  
**Output**: Professional manual test specification (Excel-ready CSV)

### Example Transformation:
```javascript
// Playwright test (technical)
await page.goto('https://www.simplify.co.uk/');
await page.getByRole('button', { name: 'Accept' }).click();
await expect(page.getByRole('main')).toContainText('customers');
```

⬇️ **Becomes** ⬇️

| Test Case ID | Test Step | Expected Result |
|--------------|-----------|-----------------|
| TC-0001 | Navigate to the Simplify website | Page loads successfully and displays expected content |
| TC-0001 | Click the Accept button for cookie consent | Button responds to click and appropriate action occurs |
| TC-0001 | Verify the main content shows customer information | Expected text content is displayed |

## 🚀 How to Generate (3 steps)

1. **Run the command**:
   ```bash
   npm run manual:smart
   ```

2. **Open the result**:
   - File: `test-results/manual-tests.manual-specs.csv`
   - Opens perfectly in Excel/Google Sheets

3. **Execute manually**:
   - Follow the "Test Step" column
   - Verify the "Expected Result" column
   - Mark "Status" as Pass/Fail

## 📊 What's In Your CSV

| Column | What It Contains |
|--------|------------------|
| **Test Case ID** | Professional numbering (TC-0001, TC-0002...) |
| **Test Title** | Business-friendly test name |
| **Description** | What this test validates |
| **Priority** | High/Medium/Low based on test importance |
| **Prerequisites** | What you need to set up first |
| **Test Data** | URLs, login credentials, test values |
| **Step #** | Sequential step numbering |
| **Test Step** | Clear action to perform |
| **Expected Result** | What should happen |
| **Actual Result** | (Empty - you fill this during testing) |
| **Status** | (Empty - mark Pass/Fail) |
| **Notes** | Additional context or warnings |

## 🎨 Language Examples

### Before (Technical)
- `goto "https://example.com"`
- `click getByRole('button', { name: 'Submit' })`
- `expect(page).toHaveTitle('Welcome')`
- `fill getByLabel('Email') "test@example.com"`

### After (Manual Tester Friendly)
- `Navigate to the Example website`
- `Click the Submit button`
- `Verify the page title shows "Welcome"`
- `Enter "test@example.com" in the Email field`

## 🔧 Enhanced Mode (Optional)

For even better results, ask your developer to set an API key:

```powershell
$env:LLM_API_KEY = "your-openai-key"
npm run manual:smart
```

**Benefits**:
- More natural language
- Better business context
- Smarter expected results
- Domain-specific terminology

## 💡 Pro Tips

1. **Excel Import**: The CSV has proper BOM encoding - no import issues
2. **TestRail Ready**: Column format matches common test management tools
3. **Status Tracking**: Empty Status column is perfect for execution tracking
4. **Reusable**: Keep the CSV in version control alongside the automation

## ❓ FAQ

**Q: Do I need to understand Playwright?**  
A: No! You just work with the generated CSV that's in plain English.

**Q: What if tests change?**  
A: Developers re-run `npm run manual:smart` and you get updated specs automatically.

**Q: Can I modify the generated specs?**  
A: Yes! Edit the CSV however you need. It's your manual test specification.

**Q: What about test data?**  
A: The system extracts URLs, form values, and other test data into the "Test Data" column.

## 🎯 Perfect For

- ✅ Regression testing checklists
- ✅ Manual verification of new features  
- ✅ User acceptance testing scripts
- ✅ Bug reproduction steps
- ✅ Training new team members
- ✅ Compliance documentation

---

*Ready to try it? Ask your development team to run `npm run manual:smart` and share the resulting CSV with you!*
