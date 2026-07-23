import mongoose from "mongoose";

/**
 * Stores every AI-generated response for future reference.
 * Users can regenerate or restore from any stored response.
 */
const aiResponseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Which AI endpoint generated this
    type: {
      type: String,
      enum: [
        "requirement_analysis",
        "test_cases",
        "automation_code",
        "database_query",
        "api_test",
        "bug_report",
        "chat",
      ],
      required: true,
    },
    // Input that was sent to AI
    input: {
      requirement: { type: String },
      extraContext: { type: Object },
    },
    // Full AI output (stored as raw JSON or text string)
    output: { type: mongoose.Schema.Types.Mixed, required: true },
    // Which provider actually generated this response
    providerUsed: { type: String, default: "fallback" },
    modelUsed: { type: String, default: "" },
    // User may edit the output; store edited version separately
    userEditedOutput: { type: mongoose.Schema.Types.Mixed },
    // Whether the user has edited this output
    isEdited: { type: Boolean, default: false },
    // Tag for grouping related responses (e.g. by ticket or session)
    tag: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("AIResponse", aiResponseSchema);
