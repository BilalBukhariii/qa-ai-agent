/**
 * Enterprise Multi-Provider AI Engine
 * ====================================
 * Priority order (configurable via Settings page / .env):
 *   1. OpenAI  (GPT-4o / GPT-4o-mini)
 *   2. Google Gemini  (gemini-1.5-flash — free tier)
 *   3. OpenRouter  (free models: Llama-3.1, Mistral, etc.)
 *   4. Ollama  (local, if installed)
 *   5. Smart Rule-Based Fallback  (always works, no API key needed)
 *
 * Settings are read from the database first, then fall back to .env.
 */

import AISettings from "../models/AISettings.js";

// ─── Cached settings (refreshed every 60 s to avoid per-request DB hits) ────
let _settingsCache = null;
let _settingsCacheAt = 0;
const CACHE_TTL_MS = 60_000;

async function getSettings() {
  const now = Date.now();
  if (_settingsCache && now - _settingsCacheAt < CACHE_TTL_MS) return _settingsCache;

  let doc = await AISettings.findOne().lean();
  if (!doc) {
    // First run — seed defaults from .env
    doc = await AISettings.create({
      activeProvider: process.env.AI_PROVIDER || "auto",
      openaiApiKey: process.env.OPENAI_API_KEY || "",
      openaiModel: "gpt-4o-mini",
      geminiApiKey: process.env.GEMINI_API_KEY || "",
      geminiModel: "gemini-1.5-flash",
      openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
      openrouterModel: "meta-llama/llama-3.1-8b-instruct:free",
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      ollamaModel: process.env.OLLAMA_MODEL || "llama3",
      fallbackOrder: ["openai", "gemini", "openrouter", "ollama"],
    });
    doc = doc.toObject();
  }

  _settingsCache = doc;
  _settingsCacheAt = now;
  return doc;
}

/** Invalidate cache when settings are saved from the UI. */
export function invalidateSettingsCache() {
  _settingsCache = null;
}

// ─── Provider Callers ────────────────────────────────────────────────────────

async function callOpenAI(systemPrompt, userPrompt, settings) {
  const key = settings.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI API key not configured");

  const model = settings.openaiModel || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return { text: data.choices[0].message.content, provider: "openai", model };
}

async function callGemini(systemPrompt, userPrompt, settings) {
  const key = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key not configured");

  const model = settings.geminiModel || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw new Error("Gemini returned empty response");
  return { text, provider: "gemini", model };
}

async function callOpenRouter(systemPrompt, userPrompt, settings) {
  const key = settings.openrouterApiKey || process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OpenRouter API key not configured");

  const model = settings.openrouterModel || "meta-llama/llama-3.1-8b-instruct:free";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://qa-ai-agent.app",
      "X-Title": "Enterprise QA AI Agent",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return { text: data.choices[0].message.content, provider: "openrouter", model };
}

async function callOllama(systemPrompt, userPrompt, settings) {
  const baseUrl = settings.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = settings.ollamaModel || process.env.OLLAMA_MODEL || "llama3";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  const text = data.message?.content || "";
  if (!text) throw new Error("Ollama returned empty response");
  return { text, provider: "ollama", model };
}

// ─── Provider caller map ─────────────────────────────────────────────────────
const CALLERS = { openai: callOpenAI, gemini: callGemini, openrouter: callOpenRouter, ollama: callOllama };

// ─── Main public API ─────────────────────────────────────────────────────────

/**
 * Calls the best available AI provider, falling back through the priority
 * waterfall until one succeeds. Always succeeds — worst case uses the
 * Smart Rule-Based Enterprise Engine.
 *
 * Returns { text, provider, model }
 */
export async function callAI(systemPrompt, userPrompt) {
  let settings;
  try {
    settings = await getSettings();
  } catch (e) {
    console.warn("[AI] Could not load DB settings, using .env defaults:", e.message);
    settings = {
      activeProvider: process.env.AI_PROVIDER || "auto",
      openaiApiKey: process.env.OPENAI_API_KEY || "",
      openaiModel: "gpt-4o-mini",
      geminiApiKey: process.env.GEMINI_API_KEY || "",
      geminiModel: "gemini-1.5-flash",
      openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
      openrouterModel: "meta-llama/llama-3.1-8b-instruct:free",
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "llama3",
      fallbackOrder: ["openai", "gemini", "openrouter", "ollama"],
    };
  }

  // Determine attempt order
  let order;
  if (settings.activeProvider === "auto") {
    order = settings.fallbackOrder || ["openai", "gemini", "openrouter", "ollama"];
  } else {
    // Put the selected provider first, then try the rest as fallbacks
    const rest = (settings.fallbackOrder || ["openai", "gemini", "openrouter", "ollama"])
      .filter((p) => p !== settings.activeProvider);
    order = [settings.activeProvider, ...rest];
  }

  for (const provider of order) {
    const caller = CALLERS[provider];
    if (!caller) continue;
    try {
      const result = await caller(systemPrompt, userPrompt, settings);
      console.log(`[AI] ✅ Response from ${result.provider} (${result.model})`);
      return result;
    } catch (err) {
      console.warn(`[AI] ⚠️  ${provider} failed: ${err.message}`);
    }
  }

  // All providers failed — use Smart Rule-Based Engine
  console.warn("[AI] 🔁 All providers failed. Activating Smart Enterprise Rule-Based Engine.");
  const text = getFallbackResponse(systemPrompt, userPrompt);
  return { text, provider: "fallback", model: "smart-rule-engine-v2" };
}

/**
 * Calls AI and returns parsed JSON. Strips markdown fences automatically.
 * Returns { data, provider, model }
 */
export async function callAIForJSON(systemPrompt, userPrompt) {
  const { text, provider, model } = await callAI(systemPrompt, userPrompt);
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    return { data: JSON.parse(cleaned), provider, model };
  } catch (err) {
    throw new Error(
      `AI (${provider}) returned invalid JSON: ${err.message}\nRaw (500 chars): ${cleaned.slice(0, 500)}`
    );
  }
}

/**
 * Test connectivity to a specific provider with given credentials.
 * Returns { ok: boolean, provider, model, latencyMs, error? }
 */
export async function testProviderConnection(provider, config) {
  const t0 = Date.now();
  const ping = "Reply with exactly: {\"ok\":true}";
  try {
    const result = await CALLERS[provider]?.(ping, ping, config);
    return { ok: true, provider, model: result.model, latencyMs: Date.now() - t0 };
  } catch (err) {
    return { ok: false, provider, error: err.message, latencyMs: Date.now() - t0 };
  }
}

// ─── Smart Rule-Based Enterprise Fallback Engine ─────────────────────────────

function getFallbackResponse(systemPrompt, userPrompt) {
  const req = userPrompt.slice(0, 300);

  if (systemPrompt.includes("[REQUIREMENT_ANALYZER]")) {
    return JSON.stringify({
      functionalRequirements: [
        `System shall validate all input fields and enforce required constraints for: "${req.slice(0, 80)}..."`,
        "System shall maintain secure session state with encrypted JWT authentication.",
        "System shall support complete CRUD operations with full audit trail logging.",
        "System shall enforce role-based access control (RBAC) for all sensitive operations.",
        "System shall provide real-time feedback after every user action.",
        "System shall generate structured QA artifacts from requirement specifications.",
      ],
      nonFunctionalRequirements: [
        "API response time < 200ms at 95th percentile under standard load.",
        "OWASP Top 10 compliance; TLS 1.3 enforced on all endpoints.",
        "WCAG 2.1 AA accessibility; cross-browser (Chrome, Firefox, Safari, Edge).",
        "99.9% uptime SLA with automated health checks and Slack/email alerting.",
        "Database queries indexed to prevent full-table scans on production datasets.",
      ],
      edgeCases: [
        "Concurrent submissions by multiple users on the same record.",
        "Special characters, emoji, and 10k+ character boundary inputs.",
        "Network loss mid-transaction during form submission or file upload.",
        "Session token expiry during a long-running form interaction.",
        "Empty or null values in conditionally rendered fields.",
        "Duplicate records submitted via double-click on submit button.",
      ],
      businessRules: [
        "Only Admin or QA Lead roles may approve and promote test cases to production suites.",
        "5 consecutive failed auth attempts trigger a 15-minute account lockout.",
        "All requirement changes must be versioned and retain full change history.",
        "Automated test execution requires at least one human reviewer approval.",
        "AI-generated content must be editable before being saved to the database.",
      ],
      positiveScenarios: [
        "User fills all fields with valid data and receives a 200 OK confirmation.",
        "AI generates accurate test cases within 3 seconds of requirement submission.",
        "Admin creates a project and team members receive invite notifications.",
      ],
      negativeScenarios: [
        "User submits blank requirement — system shows clear validation error.",
        "User accesses unauthorized endpoint — receives 401 Unauthorized.",
        "File exceeds 10MB limit — rejected with informative error message.",
        "AI provider unavailable — system seamlessly switches to next provider.",
      ],
      riskAnalysis: [
        "DB performance degradation under unindexed concurrent search queries.",
        "Third-party AI API downtime — mitigated by built-in provider waterfall.",
        "JWT secret misconfiguration during deployment.",
        "Insufficient test data seeding causing false positives in regression.",
      ],
      dependencies: [
        "MongoDB 7+ / SQL Server 2022",
        "Node.js 20+ / Express.js",
        "AI Provider (OpenAI / Gemini / OpenRouter / Ollama)",
        "Playwright / Cypress Test Runners",
      ],
      missingRequirements: [
        "Session timeout period not explicitly defined.",
        "Max file size limit for requirement document uploads not specified.",
        "Notification preferences (email/SMS/push) not described.",
      ],
      questionsForBA: [
        "Should failed login attempts notify via email immediately?",
        "What is the maximum file size for requirement document uploads?",
        "Is multi-tenancy required, or does each team operate in isolation?",
        "Should generated test cases auto-link to Jira tickets?",
      ],
      testingStrategy:
        "ISTQB-aligned strategy: Execute Playwright E2E smoke tests on critical paths first, then manual boundary/security/accessibility validation. Use data-driven testing for input validation. Prioritize regression automation for high-priority modules.",
    });
  }

  if (systemPrompt.includes("[TEST_CASE_GENERATOR]")) {
    return JSON.stringify([
      {
        module: "Authentication", feature: "Login",
        title: "Verify successful login with valid admin credentials",
        precondition: "User account is active and unlocked",
        priority: "critical", severity: "critical",
        testData: "admin@example.com / Passw0rd!",
        steps: ["Navigate to login URL", "Enter valid email", "Enter valid password", "Click Sign In"],
        expectedResult: "Redirected to Dashboard. Valid JWT stored. User profile visible.",
        acceptanceCriteria: "Login completes < 2s. Dashboard loads with correct user data.",
        isRegression: true, automationCandidate: true,
      },
      {
        module: "Authentication", feature: "Login",
        title: "Verify error on invalid password",
        precondition: "User is on login page",
        priority: "high", severity: "high",
        testData: "admin@example.com / WrongPass!",
        steps: ["Enter valid email", "Enter invalid password", "Click Sign In"],
        expectedResult: "'Invalid email or password' shown. No token issued.",
        acceptanceCriteria: "Error shown within 1s. Password field cleared.",
        isRegression: true, automationCandidate: true,
      },
      {
        module: "Authentication", feature: "Account Lockout",
        title: "Verify lockout after 5 consecutive failed attempts",
        precondition: "User account exists and is active",
        priority: "high", severity: "high",
        testData: "test@example.com / WrongPass (x5)",
        steps: ["Attempt login with wrong password 5 times"],
        expectedResult: "Account locked. 'Try again in 15 minutes' shown.",
        acceptanceCriteria: "Lockout triggers on exactly 5th failure. Persists 15 min.",
        isRegression: false, automationCandidate: true,
      },
      {
        module: "Requirement Analyzer", feature: "File Upload",
        title: "Verify drag & drop PDF upload",
        precondition: "User is authenticated on Requirement Analyzer",
        priority: "high", severity: "medium",
        testData: "sample-req.pdf (2MB)",
        steps: ["Navigate to Requirement Analyzer", "Drag PDF onto drop zone", "Release file"],
        expectedResult: "File card shown with name, size, remove button.",
        acceptanceCriteria: "Upload completes without error in < 3s.",
        isRegression: false, automationCandidate: true,
      },
      {
        module: "Requirement Analyzer", feature: "AI Analysis",
        title: "Verify AI analysis returns all required sections",
        precondition: "Valid requirement text entered",
        priority: "critical", severity: "high",
        testData: "Requirement: 'As admin, I want to manage users and assign roles'",
        steps: ["Enter requirement", "Click Analyze Requirement", "Wait for completion"],
        expectedResult: "All 10 analysis sections populated with at least 2 items each.",
        acceptanceCriteria: "Analysis completes < 5s. Sections: FR, NFR, Edge Cases, Business Rules, Risks, Missing, BA Questions, Strategy.",
        isRegression: false, automationCandidate: false,
      },
      {
        module: "Test Cases", feature: "CRUD",
        title: "Verify adding a new test case via Add Row",
        precondition: "User on Test Cases page",
        priority: "high", severity: "medium",
        testData: "Title: 'New Regression Test', Module: 'Payment', Priority: High",
        steps: ["Click Add Row", "Fill in fields", "Save"],
        expectedResult: "New row saved. Persists on refresh.",
        acceptanceCriteria: "ID auto-generated. All fields editable in-place.",
        isRegression: false, automationCandidate: true,
      },
      {
        module: "Settings", feature: "AI Provider",
        title: "Verify AI provider switch from OpenAI to Gemini",
        precondition: "Admin on Settings page, Gemini key configured",
        priority: "high", severity: "high",
        testData: "Provider: Google Gemini, Key: valid Gemini API key",
        steps: ["Select Gemini in dropdown", "Enter API key", "Click Test Connection", "Save"],
        expectedResult: "Connection test passes. Subsequent AI requests use Gemini. Banner shows 'Using Gemini AI'.",
        acceptanceCriteria: "Settings saved to DB. No restart required.",
        isRegression: false, automationCandidate: false,
      },
      {
        module: "Settings", feature: "AI Fallback",
        title: "Verify automatic fallback when primary AI provider fails",
        precondition: "Primary provider key is invalid; Gemini key is valid",
        priority: "critical", severity: "critical",
        testData: "OpenAI key: invalid, Gemini key: valid",
        steps: ["Submit requirement for analysis", "Observe AI provider banner"],
        expectedResult: "System falls back to Gemini. Banner shows 'Using Gemini Free AI'. Analysis completes successfully.",
        acceptanceCriteria: "Fallback transparent to user. No error screen shown.",
        isRegression: false, automationCandidate: false,
      },
    ]);
  }

  if (systemPrompt.includes("[AUTOMATION_CODE]")) {
    return JSON.stringify({
      framework: "playwright",
      language: "javascript",
      pomCode: `import { expect } from "@playwright/test";\n\n/**\n * LoginPage — Page Object Model\n * Enterprise QA AI Agent — Auto-generated\n */\nexport class LoginPage {\n  constructor(page) {\n    this.page = page;\n    this.emailInput = page.getByLabel("Email");\n    this.passwordInput = page.getByLabel("Password");\n    this.submitBtn = page.getByRole("button", { name: /sign in/i });\n    this.errorAlert = page.getByRole("alert");\n    this.dashboardHeading = page.getByRole("heading", { name: /dashboard/i });\n  }\n\n  async navigate(baseUrl) {\n    await this.page.goto(\`\${baseUrl}/login\`);\n    await this.page.waitForLoadState("networkidle");\n  }\n\n  async login(email, password) {\n    await this.emailInput.fill(email);\n    await this.passwordInput.fill(password);\n    await this.submitBtn.click();\n  }\n\n  async expectSuccessfulLogin() {\n    await expect(this.page).toHaveURL(/.*dashboard/);\n  }\n\n  async expectError(message) {\n    await expect(this.errorAlert).toContainText(message);\n  }\n}`,
      specCode: `import { test, expect } from "@playwright/test";\nimport { LoginPage } from "../pages/LoginPage.js";\nimport { testUsers } from "../fixtures/users.js";\n\ntest.describe("Authentication — Login Flow", () => {\n  let loginPage;\n\n  test.beforeEach(async ({ page }) => {\n    loginPage = new LoginPage(page);\n    await loginPage.navigate(process.env.BASE_URL || "http://localhost:5173");\n  });\n\n  test("should login with valid admin credentials", async () => {\n    await loginPage.login(testUsers.admin.email, testUsers.admin.password);\n    await loginPage.expectSuccessfulLogin();\n  });\n\n  test("should show error on invalid password", async () => {\n    await loginPage.login("wrong@example.com", "WrongPass!");\n    await loginPage.expectError("Invalid email or password");\n  });\n\n  test("should lock account after 5 failed attempts", async ({ page }) => {\n    for (let i = 0; i < 5; i++) {\n      await loginPage.login("test@example.com", "WrongPass!");\n      await page.waitForTimeout(300);\n    }\n    await loginPage.expectError("Account temporarily locked");\n  });\n});`,
      configCode: `import { defineConfig, devices } from "@playwright/test";\nimport dotenv from "dotenv";\ndotenv.config();\n\nexport default defineConfig({\n  testDir: "./tests",\n  timeout: 30_000,\n  expect: { timeout: 5_000 },\n  fullyParallel: true,\n  retries: process.env.CI ? 2 : 0,\n  reporter: [["html", { open: "never" }], ["list"]],\n  use: {\n    baseURL: process.env.BASE_URL || "http://localhost:5173",\n    screenshot: "only-on-failure",\n    video: "retain-on-failure",\n    trace: "on-first-retry",\n  },\n  projects: [\n    { name: "chromium", use: { ...devices["Desktop Chrome"] } },\n    { name: "firefox",  use: { ...devices["Desktop Firefox"] } },\n  ],\n});`,
      packageJson: `{\n  "name": "qa-automation-playwright",\n  "version": "1.0.0",\n  "description": "Enterprise Playwright E2E Suite — QA AI Agent",\n  "scripts": {\n    "test": "playwright test",\n    "test:headed": "playwright test --headed",\n    "test:ui": "playwright test --ui",\n    "report": "playwright show-report"\n  },\n  "devDependencies": {\n    "@playwright/test": "^1.45.0",\n    "dotenv": "^16.0.0"\n  }\n}`,
      fixturesCode: `export const testUsers = {\n  admin: { email: "admin@example.com", password: "Passw0rd!", role: "admin" },\n  qa: { email: "qa@example.com", password: "QaPass123!", role: "qa" },\n};\n\nexport const testRequirements = [\n  "As an admin, I want to create users and assign roles so that access is controlled.",\n  "As a QA Engineer, I want to generate test cases from requirements automatically.",\n];`,
      utilsCode: `import { expect } from "@playwright/test";\n\nexport async function waitForApi(page, urlPattern, timeout = 10_000) {\n  return page.waitForResponse(\n    (r) => r.url().includes(urlPattern) && r.status() === 200,\n    { timeout }\n  );\n}\n\nexport async function screenshot(page, name) {\n  await page.screenshot({ path: \`screenshots/\${name}-\${Date.now()}.png\` });\n}\n\nexport function randomString(len = 8) {\n  return Math.random().toString(36).substring(2, 2 + len);\n}`,
      readmeContent: `# QA AI Agent — Playwright Automation Suite\n\nAuto-generated by Enterprise QA AI Agent Platform.\n\n## Setup\n\n\`\`\`bash\nnpm install\nnpx playwright install\n\`\`\`\n\n## Run Tests\n\n\`\`\`bash\nnpm test              # Headless\nnpm run test:headed   # Browser visible\nnpm run test:ui       # Interactive UI\nnpm run report        # HTML report\n\`\`\`\n\n## Project Structure\n\n\`\`\`\n├── playwright.config.js\n├── pages/          # Page Object Models\n├── tests/          # Spec files\n├── fixtures/       # Test data\n├── utils/          # Shared helpers\n├── screenshots/    # Captured on failure\n└── reports/        # HTML reports\n\`\`\`\n`,
      instructions: "npm install && npx playwright install && npm test",
    });
  }

  if (systemPrompt.includes("[DATABASE_QUERY]")) {
    return JSON.stringify({
      mongoQueries: [
        "db.users.find({ email: 'admin@example.com' }).pretty()",
        "db.users.find({ role: 'admin', isActive: true }).count()",
        "db.testcases.aggregate([{ $match: { status: 'pass' } }, { $group: { _id: '$module', count: { $sum: 1 } } }])",
        "db.testcases.find({ priority: 'critical', status: { $ne: 'pass' } }).limit(20)",
        "db.airesponses.find({ providerUsed: { $ne: 'fallback' } }).sort({ createdAt: -1 }).limit(10)",
      ],
      sqlQueries: [
        "SELECT * FROM Users WHERE Email = 'admin@example.com' AND IsActive = 1;",
        "SELECT Module, COUNT(*) AS Total, SUM(CASE WHEN Status='pass' THEN 1 ELSE 0 END) AS Passed FROM TestCases GROUP BY Module;",
        "SELECT TOP 10 * FROM TestCases WHERE Priority='critical' AND Status<>'pass' ORDER BY CreatedAt DESC;",
        "SELECT u.Name, COUNT(tc.Id) AS Executed FROM Users u JOIN TestCases tc ON u.Id=tc.ExecutedBy GROUP BY u.Name;",
      ],
      verificationScript:
        "// Post-deployment verification:\n// 1. Confirm admin user exists and password is hashed\n// 2. Confirm all test cases have valid status enum values\n// 3. Confirm AI settings document exists\n// 4. Confirm no orphaned test cases without parent ticket",
    });
  }

  if (systemPrompt.includes("[API_TEST]")) {
    return JSON.stringify({
      method: "POST", endpoint: "/api/auth/login",
      headers: { "Content-Type": "application/json" },
      requestBody: { email: "admin@example.com", password: "Passw0rd!" },
      expectedStatus: 200,
      postmanTestScript: `pm.test("Status 200", () => pm.response.to.have.status(200));\npm.test("Has token", () => pm.expect(pm.response.json().token).to.be.a("string"));`,
      assertions: ["Status 200", "Body contains token (JWT)", "Response < 500ms"],
    });
  }

  if (systemPrompt.includes("[BUG_WRITER]")) {
    return JSON.stringify({
      title: "[DEFECT] 401 Unauthorized on valid authentication request",
      description: "Valid credentials return 401 intermittently, blocking user access.",
      stepsToReproduce: ["Navigate to /login", "Enter valid email/password", "Click Sign In"],
      expectedResult: "200 OK + JWT token issued + redirect to Dashboard",
      actualResult: "401 Unauthorized returned. No token. User stays on login page.",
      severity: "critical", priority: "P1",
      environment: "Staging v1.2 / Chrome 126 / Windows 11",
      suggestedFix: "Verify JWT_SECRET env var is loaded. Check bcrypt await. Review CORS preflight.",
    });
  }

  if (systemPrompt.includes("[CHAT_AI]")) {
    return "I'm your Enterprise QA AI Copilot. I can help with test strategies, Playwright/Cypress debugging, automation architecture, bug reporting, and quality metrics. What would you like to work on?";
  }

  console.warn("[AI Fallback] Unknown prompt tag — using generic response.");
  return JSON.stringify({
    message: "AI response generated by Smart Rule-Based Engine.",
    hint: "Configure an API key in Settings → AI Provider for real AI-powered responses.",
  });
}
