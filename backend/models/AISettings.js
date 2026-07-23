import mongoose from "mongoose";

/**
 * Stores AI provider configuration globally (one document per installation).
 * Sensitive keys are stored here rather than in .env so admins can change
 * them from the Settings UI without restarting the server.
 */
const aiSettingsSchema = new mongoose.Schema(
  {
    // Which provider to use first
    activeProvider: {
      type: String,
      enum: ["openai", "gemini", "openrouter", "ollama", "auto"],
      default: "auto",
    },
    // OpenAI
    openaiApiKey: { type: String, default: "" },
    openaiModel: { type: String, default: "gpt-4o-mini" },
    // Google Gemini
    geminiApiKey: { type: String, default: "" },
    geminiModel: { type: String, default: "gemini-1.5-flash" },
    // OpenRouter
    openrouterApiKey: { type: String, default: "" },
    openrouterModel: { type: String, default: "meta-llama/llama-3.1-8b-instruct:free" },
    // Ollama (local)
    ollamaBaseUrl: { type: String, default: "http://localhost:11434" },
    ollamaModel: { type: String, default: "llama3" },
    // Fallback order: the system tries each in sequence until one succeeds
    fallbackOrder: {
      type: [String],
      default: ["openai", "gemini", "openrouter", "ollama"],
    },
    // Metadata
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("AISettings", aiSettingsSchema);
