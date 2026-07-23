import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
    module: { type: String },
    title: { type: String, required: true },
    precondition: { type: String },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    environment: { type: String, default: "QA" },
    testData: { type: String },
    steps: [{ type: String }],
    expectedResult: { type: String },
    actualResult: { type: String },
    status: {
      type: String,
      enum: ["not_run", "pass", "fail", "blocked", "retest"],
      default: "not_run",
    },
    isRegression: { type: Boolean, default: false },
    automationCandidate: { type: Boolean, default: false },
    comments: { type: String },
    executionDate: { type: Date },
    executedBy: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("TestCase", testCaseSchema);
