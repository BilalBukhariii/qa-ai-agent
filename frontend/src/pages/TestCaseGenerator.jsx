import { useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../services/api.js";

const badge = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

export default function TestCaseGenerator() {
  const [requirement, setRequirement] = useState("");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    setError("");
    setCases([]);
    setSaved(false);
    if (requirement.trim().length < 10) {
      setError("Paste a requirement of at least 10 characters.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/ai/generate-testcases", { requirement });
      setCases(data);
    } catch (err) {
      setError(err.response?.data?.message || "Generation failed. Check your AI provider key in .env.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post("/ai/generate-testcases", { requirement, save: true });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save test cases.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
        AI Test Case Generator
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Paste a requirement or acceptance criteria and generate enterprise-level manual test
        cases — functional, boundary, negative, and UI coverage included.
      </p>

      <textarea
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
        rows={6}
        placeholder="Paste requirement or acceptance criteria here..."
        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
      />

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-medium transition"
        >
          {loading ? "Generating..." : "Generate Test Cases"}
        </button>
        {cases.length > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 rounded-lg px-5 py-2 text-sm font-medium transition"
          >
            {saving ? "Saving..." : `Save all ${cases.length} to Test Case bank`}
          </button>
        )}
        {saved && <span className="text-sm text-emerald-500">Saved ✓</span>}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-6">{error}</p>
      )}

      {cases.length > 0 && (
        <div className="space-y-4">
          {cases.map((tc, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {i + 1}. {tc.title}
                </h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge[tc.priority] || badge.medium}`}>
                  {tc.priority}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Module: {tc.module} · Environment: {tc.environment}
                {tc.automationCandidate && " · Automation candidate"}
              </p>
              {tc.precondition && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <span className="font-medium">Precondition:</span> {tc.precondition}
                </p>
              )}
              <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-2">
                {tc.steps?.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Expected:</span> {tc.expectedResult}
              </p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
