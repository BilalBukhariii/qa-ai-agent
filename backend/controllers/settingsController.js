import AISettings from "../models/AISettings.js";
import { invalidateSettingsCache, testProviderConnection } from "../ai/aiProvider.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/settings/ai
// ─────────────────────────────────────────────────────────────────────────────
export const getAISettings = async (req, res, next) => {
  try {
    let doc = await AISettings.findOne().lean();
    if (!doc) {
      doc = await AISettings.create({});
      doc = doc.toObject();
    }
    // Mask API keys in response — send only last 4 chars for display
    const masked = {
      ...doc,
      openaiApiKey: maskKey(doc.openaiApiKey),
      geminiApiKey: maskKey(doc.geminiApiKey),
      openrouterApiKey: maskKey(doc.openrouterApiKey),
    };
    res.json(masked);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/settings/ai
// body: { activeProvider, openaiApiKey, openaiModel, geminiApiKey, geminiModel,
//         openrouterApiKey, openrouterModel, ollamaBaseUrl, ollamaModel, fallbackOrder }
// ─────────────────────────────────────────────────────────────────────────────
export const updateAISettings = async (req, res, next) => {
  try {
    const {
      activeProvider, openaiModel, geminiModel, openrouterModel,
      ollamaBaseUrl, ollamaModel, fallbackOrder,
    } = req.body;

    let doc = await AISettings.findOne();
    if (!doc) doc = new AISettings();

    // Only update API keys if the user sent a real value (not the masked placeholder)
    if (req.body.openaiApiKey && !req.body.openaiApiKey.includes("•"))
      doc.openaiApiKey = req.body.openaiApiKey;
    if (req.body.geminiApiKey && !req.body.geminiApiKey.includes("•"))
      doc.geminiApiKey = req.body.geminiApiKey;
    if (req.body.openrouterApiKey && !req.body.openrouterApiKey.includes("•"))
      doc.openrouterApiKey = req.body.openrouterApiKey;

    if (activeProvider) doc.activeProvider = activeProvider;
    if (openaiModel) doc.openaiModel = openaiModel;
    if (geminiModel) doc.geminiModel = geminiModel;
    if (openrouterModel) doc.openrouterModel = openrouterModel;
    if (ollamaBaseUrl) doc.ollamaBaseUrl = ollamaBaseUrl;
    if (ollamaModel) doc.ollamaModel = ollamaModel;
    if (fallbackOrder) doc.fallbackOrder = fallbackOrder;
    doc.updatedBy = req.user._id;

    await doc.save();
    invalidateSettingsCache(); // Force aiProvider to re-read on next call

    res.json({ message: "AI settings saved successfully", activeProvider: doc.activeProvider });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/settings/ai/test
// body: { provider, apiKey, model?, ollamaBaseUrl? }
// ─────────────────────────────────────────────────────────────────────────────
export const testAIConnection = async (req, res, next) => {
  try {
    const { provider, apiKey, model, ollamaBaseUrl } = req.body;
    if (!provider) {
      res.status(400);
      throw new Error("provider is required");
    }

    const config = {
      openaiApiKey: provider === "openai" ? apiKey : "",
      openaiModel: model || "gpt-4o-mini",
      geminiApiKey: provider === "gemini" ? apiKey : "",
      geminiModel: model || "gemini-1.5-flash",
      openrouterApiKey: provider === "openrouter" ? apiKey : "",
      openrouterModel: model || "meta-llama/llama-3.1-8b-instruct:free",
      ollamaBaseUrl: ollamaBaseUrl || "http://localhost:11434",
      ollamaModel: model || "llama3",
    };

    const result = await testProviderConnection(provider, config);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function maskKey(key) {
  if (!key || key.length < 8) return key || "";
  return "•".repeat(key.length - 4) + key.slice(-4);
}
