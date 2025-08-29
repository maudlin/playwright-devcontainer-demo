/**
 * Smart Manual Test Generator - Single-step transformation
 * Converts Playwright tests directly into compelling manual test specifications
 * 
 * Usage:
 *   LLM_API_KEY=xxx node scripts/smart-manual-generator.mjs test-results/manual-tests.csv
 * 
 * Features:
 * - Context-aware step interpretation
 * - Business-friendly language
 * - Smart grouping and flow analysis
 * - Professional test case formatting
 * - Detailed expected results based on test context
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const DEBUG = process.env.DEBUG_MANUAL === "1";
const [,, inputPath] = process.argv;

if (!inputPath) {
  console.error("Usage: node scripts/smart-manual-generator.mjs test-results/manual-tests.csv");
  process.exit(1);
}

const apiKey = process.env.LLM_API_KEY;
const base = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const model = process.env.LLM_MODEL || "gpt-4o-mini";

// Read and parse CSV
const csv = fs.readFileSync(inputPath, "utf8");
const rows = parse(csv, { columns: true, skip_empty_lines: true, bom: true });

// Group by test name and analyze context
const testGroups = new Map();
for (const row of rows) {
  const testName = row["Test Name"] || "";
  if (!testGroups.has(testName)) {
    testGroups.set(testName, {
      name: testName,
      status: row["Test Status"] || "unknown",
      steps: [],
      context: detectTestContext(testName, row["Raw Step"])
    });
  }
  testGroups.get(testName).steps.push({
    index: parseInt(row["Step #"]) || 0,
    raw: row["Raw Step"] || "",
    manual: row["Manual Step"] || "",
    category: row["Category"] || ""
  });
}

function detectTestContext(testName, firstStep) {
  const name = testName.toLowerCase();
  const step = firstStep.toLowerCase();
  
  if (step.includes("api") || step.includes("request") || step.includes("get ") || step.includes("post ")) {
    return { type: "api", domain: extractDomain(step) };
  }
  if (step.includes("goto") || step.includes("page.")) {
    return { type: "web", domain: extractDomain(step) };
  }
  if (name.includes("login") || name.includes("auth")) {
    return { type: "auth", domain: extractDomain(step) };
  }
  if (name.includes("form") || name.includes("submit")) {
    return { type: "form", domain: extractDomain(step) };
  }
  
  return { type: "general", domain: extractDomain(step) };
}

function extractDomain(text) {
  const urlMatch = text.match(/https?:\/\/([^\/\s]+)/);
  if (urlMatch) return urlMatch[1];
  
  if (text.includes("simplify")) return "Simplify Website";
  if (text.includes("bbc")) return "BBC Weather";
  if (text.includes("catfacts") || text.includes("fact")) return "Cat Facts API";
  
  return "Application";
}

// Enhanced AI prompt for context-aware generation
const createPrompt = (testGroups) => `
You are a professional QA analyst converting automated Playwright tests into comprehensive manual test specifications that will impress manual testers.

Create manual test cases that are:
1. **Business-focused**: Use domain language, not technical jargon
2. **Context-aware**: Consider the full test flow and purpose
3. **Actionable**: Clear, specific steps a human can follow
4. **Professional**: Match industry standard test case formats

For each test group, analyze the COMPLETE flow to understand the business scenario, then create:
- Clear test case description
- Meaningful prerequisites  
- Human-friendly test steps
- Specific, valuable expected results
- Proper test data and examples

Rules:
- Replace technical assertions with business validations
- Group related actions logically
- Use active voice ("Navigate to...", "Verify that...")
- Include specific data/examples where helpful
- Make expected results verifiable by humans
- Consider user personas and real-world usage

Input test groups:
${JSON.stringify(Array.from(testGroups.entries()).map(([name, data]) => ({
  testName: name,
  context: data.context,
  status: data.status,
  steps: data.steps.sort((a, b) => a.index - b.index)
})), null, 2)}

Return a JSON array of manual test cases in this exact format:
[
  {
    "testCaseId": "TC-0001",
    "title": "Business-friendly test title",
    "description": "What this test validates from a business perspective",
    "priority": "High|Medium|Low", 
    "prerequisites": "What needs to be set up or available",
    "testData": "Specific data, URLs, or examples needed",
    "steps": [
      {
        "stepNumber": 1,
        "action": "Human-readable action to perform",
        "expectedResult": "Specific, measurable expected outcome"
      }
    ],
    "additionalNotes": "Any helpful context or edge cases"
  }
]

Focus on creating test cases that would make a manual tester think "This is exactly what I need!"
`;

async function generateWithAI(testGroups) {
  if (!apiKey) {
    console.log("ℹ️  No LLM_API_KEY set, falling back to rule-based generation");
    return generateWithRules(testGroups);
  }

  console.log("🤖 Generating intelligent manual test cases with AI...");

  const prompt = createPrompt(testGroups);
  
  const body = {
    model,
    messages: [
      { 
        role: "system", 
        content: "You are an expert QA analyst. Return ONLY a valid JSON array of manual test cases. No prose, no code fences." 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  };

  try {
    const t0 = Date.now();
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    
    if (DEBUG) {
      console.error(`AI latency: ${Date.now() - t0}ms`);
      console.error("AI response preview:", content.slice(0, 500) + "...");
    }

    // Parse AI response
    let testCases;
    try {
      testCases = JSON.parse(content.replace(/```json\n?|```\n?/g, ''));
    } catch (parseError) {
      console.warn("⚠️  Failed to parse AI response, falling back to rule-based generation");
      return generateWithRules(testGroups);
    }

    return testCases;
    
  } catch (error) {
    console.warn(`⚠️  AI generation failed: ${error.message}, falling back to rule-based generation`);
    return generateWithRules(testGroups);
  }
}

function generateWithRules(testGroups) {
  console.log("📋 Generating manual test cases with enhanced rules...");
  
  const testCases = [];
  let tcCounter = 0;

  for (const [testName, testData] of testGroups) {
    tcCounter++;
    const testCaseId = `TC-${String(tcCounter).padStart(4, "0")}`;
    
    // Enhanced rule-based generation
    const context = testData.context;
    const steps = testData.steps.sort((a, b) => a.index - b.index);
    
    const testCase = {
      testCaseId,
      title: humanizeTestName(testName, context),
      description: generateDescription(testName, context, steps),
      priority: determinePriority(testName, context),
      prerequisites: generatePrerequisites(context, steps),
      testData: extractTestData(steps, context),
      steps: transformSteps(steps, context),
      additionalNotes: generateNotes(testName, testData.status, context)
    };
    
    testCases.push(testCase);
  }
  
  return testCases;
}

function humanizeTestName(testName, context) {
  let title = testName
    .replace(/test$|spec$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
    
  if (context.type === 'api') {
    title = title.replace(/GET|POST|PUT|DELETE/gi, match => match.toUpperCase());
  }
  
  return title;
}

function generateDescription(testName, context, steps) {
  const domain = context.domain;
  
  if (context.type === 'api') {
    return `Validates API functionality for ${domain}, ensuring correct response format, status codes, and data integrity.`;
  }
  if (context.type === 'web') {
    return `Tests user interactions on ${domain}, verifying page functionality and user experience.`;
  }
  if (context.type === 'auth') {
    return `Verifies authentication and authorization flows for ${domain}.`;
  }
  if (context.type === 'form') {
    return `Tests form submission and data validation processes on ${domain}.`;
  }
  
  return `Validates core functionality and user workflows for ${domain}.`;
}

function determinePriority(testName, context) {
  const name = testName.toLowerCase();
  
  if (name.includes('critical') || name.includes('login') || context.type === 'auth') return 'High';
  if (name.includes('error') || name.includes('validation')) return 'Medium';
  if (name.includes('edge') || name.includes('optional')) return 'Low';
  
  return 'Medium';
}

function generatePrerequisites(context, steps) {
  if (context.type === 'api') {
    return "API endpoint is accessible and test environment is configured.";
  }
  if (context.type === 'web') {
    const url = extractUrl(steps);
    return url ? `Access to ${context.domain} (${url})` : `Access to ${context.domain}`;
  }
  if (context.type === 'auth') {
    return "Valid test credentials and access to authentication system.";
  }
  
  return "Test environment is set up and accessible.";
}

function extractUrl(steps) {
  for (const step of steps) {
    const urlMatch = step.raw.match(/https?:\/\/[^\s'"]+/);
    if (urlMatch) return urlMatch[0];
  }
  return null;
}

function extractTestData(steps, context) {
  const data = [];
  
  // Extract URLs
  const url = extractUrl(steps);
  if (url) data.push(`URL: ${url}`);
  
  // Extract form data
  for (const step of steps) {
    const fillMatch = step.raw.match(/fill.*["']([^"']+)["']/i);
    if (fillMatch) data.push(`Input data: "${fillMatch[1]}"`);
    
    const clickMatch = step.raw.match(/name:\s*["']([^"']+)["']/i);
    if (clickMatch) data.push(`UI element: "${clickMatch[1]}"`);
  }
  
  return data.length > 0 ? data.join('; ') : 'No specific test data required.';
}

function transformSteps(steps, context) {
  const transformedSteps = [];
  let stepNumber = 1;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const nextStep = steps[i + 1];
    
    // Skip setup/teardown steps
    if (isSetupTeardownStep(step.raw)) continue;
    
    const action = transformAction(step.raw, step.category, context);
    const expectedResult = generateExpectedResult(step, nextStep, context);
    
    // Skip if this is a verify step that should be merged with previous
    if (step.category === 'expect' && transformedSteps.length > 0) {
      // Merge with previous step's expected result
      transformedSteps[transformedSteps.length - 1].expectedResult = expectedResult;
      continue;
    }
    
    transformedSteps.push({
      stepNumber: stepNumber++,
      action,
      expectedResult
    });
  }
  
  return transformedSteps;
}

function isSetupTeardownStep(rawStep) {
  const setup = /^(launch browser|create context|create page|close)/i;
  return setup.test(rawStep);
}

function transformAction(rawStep, category, context) {
  let action = rawStep.replace(/^pw:\s*api\s*/i, '').trim();
  
  // URL transformations
  action = action.replace(/goto\s+["']([^"']+)["']/i, (_, url) => {
    if (url === '/') return 'Navigate to the home page';
    return `Navigate to ${url}`;
  });
  
  // Click transformations
  action = action.replace(/click.*getByRole\('([^']+)',\s*{\s*name:\s*'([^']+)'\s*}\)/i, 
    (_, role, name) => `Click the ${role} labeled "${name}"`);
  
  // Fill transformations  
  action = action.replace(/fill.*["']([^"']+)["'].*getByRole\('([^']+)',\s*{\s*name:\s*'([^']+)'\s*}\)/i,
    (_, value, role, name) => `Enter "${value}" in the ${role} field labeled "${name}"`);
  
  // API transformations
  if (context.type === 'api') {
    action = action.replace(/GET\s+["']([^"']+)["']/i, (_, endpoint) => `Send GET request to ${endpoint}`);
    action = action.replace(/POST\s+["']([^"']+)["']/i, (_, endpoint) => `Send POST request to ${endpoint}`);
  }
  
  // Expect transformations
  if (category === 'expect') {
    action = action.replace(/^expect/, 'Verify that');
    action = action.replace(/toBeVisible\(\)/, 'the element is visible');
    action = action.replace(/toHaveText\(["']([^"']+)["']\)/, 'the text "$1" is displayed');
    action = action.replace(/toHaveTitle\(["']([^"']+)["']\)/, 'the page title is "$1"');
  }
  
  // Capitalize first letter
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function generateExpectedResult(step, nextStep, context) {
  const raw = step.raw.toLowerCase();
  const category = step.category;
  
  if (category === 'expect') {
    if (raw.includes('tobevisible')) return 'Element is displayed on the page';
    if (raw.includes('tohavetext')) return 'Expected text content is shown';
    if (raw.includes('tohavetitle')) return 'Page title matches expectation';
    if (raw.includes('tohaveurl')) return 'Browser URL is correct';
    if (raw.includes('toequal')) return 'Values match exactly';
    if (raw.includes('tobegreaterthan')) return 'Value meets minimum threshold';
    return 'Condition is satisfied';
  }
  
  if (raw.includes('goto') || raw.includes('navigate')) {
    return 'Page loads successfully and displays expected content';
  }
  
  if (raw.includes('click')) {
    // Look ahead to see what we're verifying next
    if (nextStep && nextStep.category === 'expect') {
      return 'Click action triggers expected response (see next verification)';
    }
    return 'Button/link responds to click and appropriate action occurs';
  }
  
  if (raw.includes('fill') || raw.includes('type')) {
    return 'Text is entered correctly in the field';
  }
  
  if (context.type === 'api') {
    if (raw.includes('get') || raw.includes('post')) {
      return 'API responds with expected status code and data format';
    }
  }
  
  return 'Action completes without errors';
}

function generateNotes(testName, status, context) {
  const notes = [];
  
  if (status === 'failed') {
    notes.push('⚠️ This test case was failing in automation - may need investigation');
  }
  
  if (context.type === 'api') {
    notes.push('This test validates API functionality - consider testing with various data inputs');
  }
  
  if (testName.toLowerCase().includes('edge')) {
    notes.push('Edge case scenario - pay attention to boundary conditions');
  }
  
  return notes.join('. ') || 'Standard manual test execution applies.';
}

// Main execution
async function main() {
  const testCases = await generateWithAI(testGroups);
  
  // Convert to flat CSV format for Excel compatibility
  const csvRows = [];
  
  for (const testCase of testCases) {
    for (let i = 0; i < testCase.steps.length; i++) {
      const step = testCase.steps[i];
      csvRows.push({
        'Test Case ID': testCase.testCaseId,
        'Test Title': testCase.title,
        'Description': i === 0 ? testCase.description : '', // Only show on first row
        'Priority': i === 0 ? testCase.priority : '',
        'Prerequisites': i === 0 ? testCase.prerequisites : '',
        'Test Data': i === 0 ? testCase.testData : '',
        'Step #': step.stepNumber,
        'Test Step': step.action,
        'Expected Result': step.expectedResult,
        'Actual Result': '', // Empty for manual testing
        'Status': '', // Empty for manual testing
        'Notes': i === 0 ? testCase.additionalNotes : ''
      });
    }
  }
  
  // Write enhanced CSV
  const outCsv = stringify(csvRows, { 
    header: true,
    quoted_string: true 
  });
  
  const outPath = inputPath.replace(/\.csv$/, '.manual-specs.csv');
  fs.writeFileSync(outPath, '\uFEFF' + outCsv, 'utf8');
  
  console.log(`\n✅ Enhanced manual test specification created!`);
  console.log(`📄 File: ${outPath}`);
  console.log(`📊 Generated ${testCases.length} test cases with ${csvRows.length} total steps`);
  console.log(`\n🎯 Features:`);
  console.log(`   • Business-friendly language`);
  console.log(`   • Context-aware descriptions`);
  console.log(`   • Professional test case format`);
  console.log(`   • Excel-ready CSV with BOM`);
  console.log(`   • Ready for manual execution\n`);
}

main().catch(console.error);
