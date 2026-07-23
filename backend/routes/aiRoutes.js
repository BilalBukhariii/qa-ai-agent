import express from "express";
import {
  analyzeRequirement,
  generateTestCases,
  generateAutomationCode,
  generateDatabaseQueries,
  generateApiTests,
  chatWithAI,
  generateBugReport,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/analyze-requirement", protect, analyzeRequirement);
router.post("/generate-testcases", protect, generateTestCases);
router.post("/generate-automation", protect, generateAutomationCode);
router.post("/generate-database", protect, generateDatabaseQueries);
router.post("/generate-api-tests", protect, generateApiTests);
router.post("/chat", protect, chatWithAI);
router.post("/generate-bug", protect, generateBugReport);

export default router;
