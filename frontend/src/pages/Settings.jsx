import { useState, useEffect } from "react";
import Layout from "../components/Layout.jsx";
import api from "../services/api.js";
import {
  Settings, Key, Zap, CheckCircle2, XCircle, Loader2, Save,
  AlertTriangle, Info, RefreshCw, Eye, EyeOff, ChevronDown,
  Cpu, Globe, Server, Database, Shield, Clock, Star,
  ArrowUpDown, Check, X
} from "lucide-react";

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI ChatGPT",
    icon: "🤖",
    badge: "Preferred",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    color: "indigo",
    description: "GPT-4o / GPT-4o-mini — Industry standard, highest quality",
    keyLabel: "OpenAI API Key",
    keyPlaceholder: "sk-proj-...",
    keyLink: "https://platform.openai.com/api-keys",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o-mini",
    free: false,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "✨",
    badge: "Free Tier",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    color: "emerald",
    description: "Gemini 1.5 Flash — Free tier available, excellent for QA",
    keyLabel: "Gemini API Key",
    keyPlaceholder: "AIzaSy...",
    keyLink: "https://aistudio.google.com/apikey",
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
    defaultModel: "gemini-1.5-flash",
    free: true,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: "🔀",
    badge: "Free Models",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    color: "purple",
    description: "Access 100+ models including free Llama-3.1, Mistral, Qwen",
    keyLabel: "OpenRouter API Key",
    keyPlaceholder: "sk-or-...",
    keyLink: "https://openrouter.ai/keys",
    models: [
      "meta-llama/llama-3.1-8b-instruct:free",
      "mistralai/mistral-7b-instruct:free",
      "qwen/qwen-2-7b-instruct:free",
      "google/gemma-2-9b-it:free",
    ],
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
    free: true,
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    icon: "🦙",
    badge: "100% Free",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    color: "amber",
    description: "Run LLMs locally — no API key, complete privacy",
    keyLabel: "Base URL",
    keyPlaceholder: "http://localhost:11434",
    keyLink: "https://ollama.com/download",
    models: ["llama3", "llama3.1", "mistral", "qwen2", "phi3", "gemma2"],
    defaultModel: "llama3",
    free: true,
  },
];

const FALLBACK_ORDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "gemini", label: "Gemini" },
  { id: "openrouter", label: "OpenRouter" },
  { id: "ollama", label: "Ollama" },
];

let toastId = 0;

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    activeProvider: "auto",
    openaiApiKey: "", openaiModel: "gpt-4o-mini",
    geminiApiKey: "", geminiModel: "gemini-1.5-flash",
    openrouterApiKey: "", openrouterModel: "meta-llama/llama-3.1-8b-instruct:free",
    ollamaBaseUrl: "http://localhost:11434", ollamaModel: "llama3",
    fallbackOrder: ["openai", "gemini", "openrouter", "ollama"],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [toasts, setToasts] = useState([]);
  const [aiHistory, setAIHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const toast = (msg, type = "info") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await api.get("/settings/ai");
      setSettings((s) => ({
        ...s,
        activeProvider: data.activeProvider || "auto",
        openaiApiKey: data.openaiApiKey || "",
        openaiModel: data.openaiModel || "gpt-4o-mini",
        geminiApiKey: data.geminiApiKey || "",
        geminiModel: data.geminiModel || "gemini-1.5-flash",
        openrouterApiKey: data.openrouterApiKey || "",
        openrouterModel: data.openrouterModel || "meta-llama/llama-3.1-8b-instruct:free",
        ollamaBaseUrl: data.ollamaBaseUrl || "http://localhost:11434",
        ollamaModel: data.ollamaModel || "llama3",
        fallbackOrder: data.fallbackOrder || ["openai", "gemini", "openrouter", "ollama"],
      }));
    } catch (e) {
      toast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get("/ai/history");
      setAIHistory(data || []);
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings/ai", settings);
      toast("✅ AI settings saved successfully!", "success");
    } catch (e) {
      toast(e.response?.data?.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (providerId) => {
    const provider = PROVIDERS.find((p) => p.id === providerId);
    setTestingProvider(providerId);
    setTestResults((prev) => ({ ...prev, [providerId]: null }));

    const keyField = {
      openai: settings.openaiApiKey,
      gemini: settings.geminiApiKey,
      openrouter: settings.openrouterApiKey,
      ollama: settings.ollamaBaseUrl,
    }[providerId];

    const modelField = {
      openai: settings.openaiModel,
      gemini: settings.geminiModel,
      openrouter: settings.openrouterModel,
      ollama: settings.ollamaModel,
    }[providerId];

    try {
      const { data } = await api.post("/settings/ai/test", {
        provider: providerId,
        apiKey: keyField,
        model: modelField,
        ollamaBaseUrl: settings.ollamaBaseUrl,
      });
      setTestResults((prev) => ({ ...prev, [providerId]: data }));
      if (data.ok) toast(`✅ ${provider.name} connected (${data.latencyMs}ms)`, "success");
      else toast(`❌ ${provider.name} failed: ${data.error}`, "error");
    } catch (e) {
      const err = e.response?.data?.message || e.message;
      setTestResults((prev) => ({ ...prev, [providerId]: { ok: false, error: err } }));
      toast(`Connection test failed: ${err}`, "error");
    } finally {
      setTestingProvider(null);
    }
  };

  const toggleKeyVisibility = (key) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getKeyFieldForProvider = (p) => {
    if (p.id === "openai") return { field: "openaiApiKey", value: settings.openaiApiKey };
    if (p.id === "gemini") return { field: "geminiApiKey", value: settings.geminiApiKey };
    if (p.id === "openrouter") return { field: "openrouterApiKey", value: settings.openrouterApiKey };
    if (p.id === "ollama") return { field: "ollamaBaseUrl", value: settings.ollamaBaseUrl };
  };

  const getModelFieldForProvider = (p) => {
    if (p.id === "openai") return { field: "openaiModel", models: p.models, value: settings.openaiModel };
    if (p.id === "gemini") return { field: "geminiModel", models: p.models, value: settings.geminiModel };
    if (p.id === "openrouter") return { field: "openrouterModel", models: p.models, value: settings.openrouterModel };
    if (p.id === "ollama") return { field: "ollamaModel", models: p.models, value: settings.ollamaModel };
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg pointer-events-auto max-w-sm ${
            t.type === "success" ? "bg-emerald-600 text-white" :
            t.type === "error" ? "bg-red-600 text-white" :
            "bg-gray-900 text-white"
          }`}>
            {t.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : t.type === "error" ? <X className="w-4 h-4 shrink-0" /> : <Info className="w-4 h-4 shrink-0" />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-500" /> AI Provider Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Configure AI providers for test case generation. The system tries each in priority order.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-md"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Active Provider Selection */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/60 mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-500" /> Active AI Provider
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Select which provider to use. Choose <strong>Auto</strong> to use the priority waterfall below.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <button
            onClick={() => setSettings((s) => ({ ...s, activeProvider: "auto" }))}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition ${settings.activeProvider === "auto" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300"}`}
          >
            <ArrowUpDown className="w-5 h-5" />
            Auto Waterfall
          </button>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSettings((s) => ({ ...s, activeProvider: p.id }))}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition ${settings.activeProvider === p.id ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300"}`}
            >
              <span className="text-xl">{p.icon}</span>
              {p.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {settings.activeProvider === "auto" && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl">
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5" /> Waterfall Priority Order
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {(settings.fallbackOrder || []).map((pid, idx) => {
                const p = PROVIDERS.find((x) => x.id === pid);
                return p ? (
                  <div key={pid} className="flex items-center gap-1">
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                      <span>{p.icon}</span> {p.name.split(" ")[0]}
                    </span>
                    {idx < settings.fallbackOrder.length - 1 && <span className="text-gray-300 text-xs">→</span>}
                  </div>
                ) : null;
              })}
              <span className="text-xs text-gray-400">→ Smart Fallback</span>
            </div>
          </div>
        )}
      </div>

      {/* Provider Configuration Cards */}
      <div className="space-y-4 mb-6">
        {PROVIDERS.map((provider) => {
          const keyConfig = getKeyFieldForProvider(provider);
          const modelConfig = getModelFieldForProvider(provider);
          const testResult = testResults[provider.id];
          const isTesting = testingProvider === provider.id;
          const isActive = settings.activeProvider === provider.id ||
            (settings.activeProvider === "auto" && settings.fallbackOrder?.[0] === provider.id);

          return (
            <div key={provider.id} className={`bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border transition ${
              isActive ? "border-indigo-300 dark:border-indigo-600/60 shadow-indigo-100 dark:shadow-indigo-900/20" : "border-gray-100 dark:border-gray-700/60"
            }`}>
              {/* Provider Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-${provider.color}-100 dark:bg-${provider.color}-900/30 flex items-center justify-center text-xl`}>
                    {provider.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${provider.badgeColor}`}>
                        {provider.badge}
                      </span>
                      {isActive && settings.activeProvider !== "auto" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{provider.description}</p>
                  </div>
                </div>

                {/* Test Connection Status */}
                {testResult && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${
                    testResult.ok
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {testResult.ok ? `Connected (${testResult.latencyMs}ms)` : `Failed: ${testResult.error?.slice(0, 40)}...`}
                  </div>
                )}
              </div>

              {/* Provider Config Fields */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* API Key / URL Field */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    {provider.keyLabel}
                    {provider.id !== "ollama" && (
                      <a href={provider.keyLink} target="_blank" rel="noopener noreferrer"
                        className="ml-2 text-indigo-500 hover:text-indigo-600 normal-case font-normal">
                        Get key →
                      </a>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys[provider.id] || provider.id === "ollama" ? "text" : "password"}
                      placeholder={provider.keyPlaceholder}
                      value={keyConfig.value}
                      onChange={(e) => setSettings((s) => ({ ...s, [keyConfig.field]: e.target.value }))}
                      className="w-full pr-10 p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    {provider.id !== "ollama" && (
                      <button
                        onClick={() => toggleKeyVisibility(provider.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {provider.id === "ollama" && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                      <strong>Setup:</strong> Install Ollama from{" "}
                      <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="underline">ollama.com/download</a>
                      {" "}then run: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-mono">ollama run llama3</code>
                    </div>
                  )}
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Model
                  </label>
                  <select
                    value={modelConfig.value}
                    onChange={(e) => setSettings((s) => ({ ...s, [modelConfig.field]: e.target.value }))}
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {modelConfig.models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  {provider.free && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Free tier available
                    </p>
                  )}
                </div>
              </div>

              {/* Test Connection Button */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => handleTestConnection(provider.id)}
                  disabled={isTesting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                    testResult?.ok === true
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                      : testResult?.ok === false
                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {isTesting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...</>
                    : testResult?.ok === true
                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Connected</>
                    : testResult?.ok === false
                    ? <><XCircle className="w-3.5 h-3.5" /> Retry Connection</>
                    : <><Zap className="w-3.5 h-3.5" /> Test Connection</>
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Response History */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 mb-6">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> AI Response History
            <span className="text-xs font-normal text-gray-400">Last 50 responses</span>
          </h2>
          <button onClick={loadHistory} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition">
            <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold">
              <tr>
                {["Type", "Provider Used", "Model", "Date", "Input Preview"].map((h) => (
                  <th key={h} className="px-4 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {historyLoading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />Loading...
                </td></tr>
              ) : aiHistory.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No AI responses yet. Generate some test cases to see history here.
                </td></tr>
              ) : (
                aiHistory.map((h) => (
                  <tr key={h._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 capitalize">
                        {h.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          h.providerUsed === "openai" ? "bg-indigo-500" :
                          h.providerUsed === "gemini" ? "bg-emerald-500" :
                          h.providerUsed === "openrouter" ? "bg-purple-500" :
                          h.providerUsed === "ollama" ? "bg-amber-500" :
                          "bg-gray-400"
                        }`} />
                        <span className="capitalize">{h.providerUsed}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-gray-500">{h.modelUsed || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 max-w-[250px] truncate">
                      {h.input?.requirement?.slice(0, 80) || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ISTQB Info Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold mb-1">ISTQB-Grade AI Prompts</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Every AI request uses a structured system prompt instructing the model to act as a
              <em> "Senior QA Lead with 15+ years of experience in Manual Testing, Automation (Playwright/Cypress),
              API Testing, Database Testing, and Enterprise QA processes."</em>{" "}
              All artifacts follow ISTQB standards, IEEE 829 bug report format, and Boundary Value Analysis / Equivalence
              Partitioning techniques.
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {["ISTQB", "IEEE 829", "BVA / EP", "POM Architecture", "OWASP Security", "CI/CD Ready"].map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-white/10 rounded-lg text-[10px] font-medium">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
