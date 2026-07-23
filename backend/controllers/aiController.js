import { callAI, callAIForJSON } from "../ai/aiProvider.js";
import {
  REQUIREMENT_ANALYZER_SYSTEM, buildRequirementAnalyzerPrompt,
  TEST_CASE_GENERATOR_SYSTEM, buildTestCaseGeneratorPrompt,
  AUTOMATION_CODE_SYSTEM, buildAutomationCodePrompt,
  DATABASE_QUERY_SYSTEM, buildDatabaseQueryPrompt,
  API_TEST_SYSTEM, buildApiTestPrompt,
  CHAT_AI_SYSTEM,
  BUG_WRITER_SYSTEM, buildBugReportPrompt,
} from "../ai/prompts.js";
import TestCase from "../models/TestCase.js";
import AIResponse from "../models/AIResponse.js";

/** Helper — saves an AI response to the DB (non-blocking, never throws). */
async function saveAIResponse(userId, type, input, output, provider, model) {
  try {
    await AIResponse.create({
      user: userId,
      type,
      input,
      output,
      providerUsed: provider,
      modelUsed: model,
    });
  } catch (e) {
    console.error("[AIController] Failed to save AI response to DB:", e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/analyze-requirement
// body: { requirement, acceptanceCriteria?, websiteUrl? }
// ─────────────────────────────────────────────────────────────────────────────
export const analyzeRequirement = async (req, res, next) => {
  try {
    const { requirement, acceptanceCriteria, websiteUrl } = req.body;
    if (!requirement || requirement.trim().length < 10) {
      res.status(400);
      throw new Error("Please provide a requirement of at least 10 characters");
    }

    const { data, provider, model } = await callAIForJSON(
      REQUIREMENT_ANALYZER_SYSTEM,
      buildRequirementAnalyzerPrompt(requirement, acceptanceCriteria, websiteUrl)
    );

    // Persist to DB
    saveAIResponse(req.user._id, "requirement_analysis",
      { requirement, acceptanceCriteria, websiteUrl }, data, provider, model);

    res.json({ ...data, _providerUsed: provider, _modelUsed: model });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/generate-testcases
// body: { requirement, acceptanceCriteria?, testTypes?, ticket?, save? }
// ─────────────────────────────────────────────────────────────────────────────
export const generateTestCases = async (req, res, next) => {
  try {
    const { requirement, acceptanceCriteria, ticket, testTypes, save } = req.body;
    if (!requirement || requirement.trim().length < 10) {
      res.status(400);
      throw new Error("Please provide a requirement of at least 10 characters");
    }

    const { data, provider, model } = await callAIForJSON(
      TEST_CASE_GENERATOR_SYSTEM,
      buildTestCaseGeneratorPrompt(requirement, testTypes, acceptanceCriteria)
    );

    if (!Array.isArray(data)) {
      res.status(502);
      throw new Error("AI did not return an array of test cases");
    }

    const withMeta = data.map((tc) => ({ ...tc, ticket: ticket || undefined, status: "not_run" }));

    saveAIResponse(req.user._id, "test_cases",
      { requirement, testTypes }, withMeta, provider, model);

    if (save) {
      const created = await TestCase.insertMany(withMeta);
      return res.status(201).json({ testCases: created, _providerUsed: provider, _modelUsed: model });
    }

    res.json({ testCases: withMeta, _providerUsed: provider, _modelUsed: model });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/generate-automation
// body: { requirement, framework?, language?, appDetails? }
// ─────────────────────────────────────────────────────────────────────────────
export const generateAutomationCode = async (req, res, next) => {
  try {
    const { requirement, framework = "playwright", language = "javascript", appDetails } = req.body;
    if (!requirement || requirement.trim().length < 10) {
      res.status(400);
      throw new Error("Please provide a requirement of at least 10 characters");
    }

    const { data, provider, model } = await callAIForJSON(
      AUTOMATION_CODE_SYSTEM,
      buildAutomationCodePrompt(requirement, framework, language, appDetails)
    );

    saveAIResponse(req.user._id, "automation_code",
      { requirement, framework, language, appDetails }, data, provider, model);

    res.json({ ...data, _providerUsed: provider, _modelUsed: model });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/generate-database
// ─────────────────────────────────────────────────────────────────────────────
export const generateDatabaseQueries = async (req, res, next) => {
  try {
    const { requirement } = req.body;
    const { data, provider, model } = await callAIForJSON(
      DATABASE_QUERY_SYSTEM, buildDatabaseQueryPrompt(requirement)
    );
    saveAIResponse(req.user._id, "database_query", { requirement }, data, provider, model);
    res.json({ ...data, _providerUsed: provider, _modelUsed: model });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/generate-api-tests
// ─────────────────────────────────────────────────────────────────────────────
export const generateApiTests = async (req, res, next) => {
  try {
    const { requirement } = req.body;
    const { data, provider, model } = await callAIForJSON(
      API_TEST_SYSTEM, buildApiTestPrompt(requirement)
    );
    saveAIResponse(req.user._id, "api_test", { requirement }, data, provider, model);
    res.json({ ...data, _providerUsed: provider, _modelUsed: model });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/chat
// ─────────────────────────────────────────────────────────────────────────────
export const chatWithAI = async (req, res, next) => {
  try {
    const { message } = req.body;
    const { text, provider, model } = await callAI(CHAT_AI_SYSTEM, message);
    saveAIResponse(req.user._id, "chat", { requirement: message }, text, provider, model);
    res.json({ reply: text, _providerUsed: provider, _modelUsed: model });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/generate-bug
// ─────────────────────────────────────────────────────────────────────────────
export const generateBugReport = async (req, res, next) => {
  try {
    const { description, environment, browser } = req.body;
    const { data, provider, model } = await callAIForJSON(
      BUG_WRITER_SYSTEM, buildBugReportPrompt(description, environment, browser)
    );
    saveAIResponse(req.user._id, "bug_report", { requirement: description }, data, provider, model);
    res.json({ ...data, _providerUsed: provider, _modelUsed: model });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/history
// Returns the last 50 AI responses for the current user
// ─────────────────────────────────────────────────────────────────────────────
export const getAIHistory = async (req, res, next) => {
  try {
    const history = await AIResponse.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(history);
  } catch (error) {
    next(error);
  }
};
