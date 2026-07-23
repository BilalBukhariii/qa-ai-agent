import { callAI, callAIForJSON } from "../ai/aiProvider.js";
import {
  REQUIREMENT_ANALYZER_SYSTEM,
  buildRequirementAnalyzerPrompt,
  TEST_CASE_GENERATOR_SYSTEM,
  buildTestCaseGeneratorPrompt,
  AUTOMATION_CODE_SYSTEM,
  buildAutomationCodePrompt,
  DATABASE_QUERY_SYSTEM,
  buildDatabaseQueryPrompt,
  API_TEST_SYSTEM,
  buildApiTestPrompt,
  CHAT_AI_SYSTEM,
  BUG_WRITER_SYSTEM,
  buildBugReportPrompt,
} from "../ai/prompts.js";
import TestCase from "../models/TestCase.js";

// @route POST /api/ai/analyze-requirement
// body: { requirement: string }
export const analyzeRequirement = async (req, res, next) => {
  try {
    const { requirement } = req.body;
    if (!requirement || requirement.trim().length < 10) {
      res.status(400);
      throw new Error("Please provide a requirement of at least 10 characters");
    }

    const analysis = await callAIForJSON(
      REQUIREMENT_ANALYZER_SYSTEM,
      buildRequirementAnalyzerPrompt(requirement)
    );

    res.json(analysis);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/ai/generate-testcases
// body: { requirement: string, ticket?: ticketId, testTypes?: string[], save?: boolean }
export const generateTestCases = async (req, res, next) => {
  try {
    const { requirement, ticket, testTypes, save } = req.body;
    if (!requirement || requirement.trim().length < 10) {
      res.status(400);
      throw new Error("Please provide a requirement of at least 10 characters");
    }

    const generated = await callAIForJSON(
      TEST_CASE_GENERATOR_SYSTEM,
      buildTestCaseGeneratorPrompt(requirement, testTypes)
    );

    if (!Array.isArray(generated)) {
      res.status(502);
      throw new Error("AI did not return an array of test cases");
    }

    const withTicket = generated.map((tc) => ({
      ...tc,
      ticket: ticket || undefined,
      status: "not_run",
    }));

    if (save) {
      const created = await TestCase.insertMany(withTicket);
      return res.status(201).json(created);
    }

    res.json(withTicket);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/ai/generate-automation
// body: { requirement: string, framework?: string, language?: string, appDetails?: object }
export const generateAutomationCode = async (req, res, next) => {
  try {
    const { requirement, framework, language, appDetails } = req.body;
    if (!requirement || requirement.trim().length < 10) {
      res.status(400);
      throw new Error("Please provide a requirement of at least 10 characters");
    }
    const result = await callAIForJSON(
      AUTOMATION_CODE_SYSTEM,
      buildAutomationCodePrompt(requirement, framework, language, appDetails)
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/ai/generate-database
export const generateDatabaseQueries = async (req, res, next) => {
  try {
    const { requirement } = req.body;
    const result = await callAIForJSON(
      DATABASE_QUERY_SYSTEM,
      buildDatabaseQueryPrompt(requirement)
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/ai/generate-api-tests
export const generateApiTests = async (req, res, next) => {
  try {
    const { requirement } = req.body;
    const result = await callAIForJSON(
      API_TEST_SYSTEM,
      buildApiTestPrompt(requirement)
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/ai/chat
export const chatWithAI = async (req, res, next) => {
  try {
    const { message } = req.body;
    const reply = await callAI(CHAT_AI_SYSTEM, message);
    res.json({ reply });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/ai/generate-bug
export const generateBugReport = async (req, res, next) => {
  try {
    const { description } = req.body;
    const bug = await callAIForJSON(
      BUG_WRITER_SYSTEM,
      buildBugReportPrompt(description)
    );
    res.json(bug);
  } catch (error) {
    next(error);
  }
};
