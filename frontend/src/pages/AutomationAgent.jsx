import { useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../services/api.js";
import { Sparkles, Code, Play, Check, Copy } from "lucide-react";

export default function AutomationAgent() {
  const [requirement, setRequirement] = useState("");
  const [framework, setFramework] = useState("playwright");
  const [language, setLanguage] = useState("javascript");
  const [codeResult, setCodeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setError("");
    setCodeResult(null);
    if (!requirement.trim()) {
      setError("Please enter a feature requirement or user story.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/ai/generate-automation", {
        requirement,
        framework,
        language,
      });
      setCodeResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate automation code.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            AI Automation Agent (Playwright & Cypress)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate enterprise Page Object Models, test specs, and execution scripts automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Controls Column */}
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 lg:col-span-1 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Select Framework
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFramework("playwright")}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition ${
                  framework === "playwright"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Playwright
              </button>
              <button
                onClick={() => setFramework("cypress")}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition ${
                  framework === "cypress"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Cypress
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Feature Requirement / Spec
            </label>
            <textarea
              rows={6}
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="e.g. Verify checkout flow with promo code discount application..."
              className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? "Synthesizing Framework..." : "Generate Automation Suite"}
          </button>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Code Display Column */}
        <div className="bg-gray-900 text-gray-100 rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between font-mono relative overflow-hidden">
          {codeResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                  Page Object & Spec Code
                </span>
                <button
                  onClick={() => copyToClipboard(codeResult.specCode || codeResult.pomCode)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1 rounded-lg"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Code"}
                </button>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">// Page Object Model Class</p>
                <pre className="text-xs bg-gray-950 p-4 rounded-xl overflow-x-auto text-emerald-400 max-h-64">
                  {codeResult.pomCode}
                </pre>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">// Automated Test Spec</p>
                <pre className="text-xs bg-gray-950 p-4 rounded-xl overflow-x-auto text-indigo-300 max-h-64">
                  {codeResult.specCode}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-gray-500">
              <Code className="w-12 h-12 mb-3 text-gray-700" />
              <p className="text-sm">Select framework options and click Generate</p>
              <p className="text-xs text-gray-600 mt-1">Generates production-grade POM and test scripts</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
