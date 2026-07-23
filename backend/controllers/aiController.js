import { callAIForJSON } from "../ai/aiProvider.js";
import {
  REQUIREMENT_ANALYZER_SYSTEM,
  buildRequirementAnalyzerPrompt,
  TEST_CASE_GENERATOR_SYSTEM,
  buildTestCaseGeneratorPrompt,
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
