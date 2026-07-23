import express from "express";
import { getAISettings, updateAISettings, testAIConnection } from "../controllers/settingsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only authenticated users can view settings; only admin/qa_lead can update
router.get("/ai", protect, getAISettings);
router.put("/ai", protect, authorize("admin", "qa_lead"), updateAISettings);
router.post("/ai/test", protect, testAIConnection);

export default router;
