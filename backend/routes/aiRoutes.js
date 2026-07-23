import express from "express";
import { analyzeRequirement, generateTestCases } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/analyze-requirement", protect, analyzeRequirement);
router.post("/generate-testcases", protect, generateTestCases);

export default router;
