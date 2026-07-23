import express from "express";
import {
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from "../controllers/testCaseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getTestCases).post(protect, createTestCase);
router
  .route("/:id")
  .get(protect, getTestCaseById)
  .put(protect, updateTestCase)
  .delete(protect, deleteTestCase);

export default router;
