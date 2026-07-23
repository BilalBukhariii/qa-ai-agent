import { useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../services/api.js";

const SECTIONS = [
  ["functionalRequirements", "Functional Requirements"],
  ["nonFunctionalRequirements", "Non-Functional Requirements"],
  ["edgeCases", "Edge Cases"],
  ["businessRules", "Business Rules"],
  ["positiveScenarios", "Positive Scenarios"],
  ["negativeScenarios", "Negative Scenarios"],
  ["riskAnalysis", "Risk Analysis"],
  ["dependencies", "Dependencies"],
  ["missingRequirements", "Missing Requirements"],
  ["questionsForBA", "Questions for BA"],
];

export default function RequirementAnalyzer() {
  const [requirement, setRequirement] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setError("");
    setResult(null);
    if (requirement.trim().length < 10) {
      setError("Paste a requirement of at least 10 characters.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/ai/analyze-requirement", { requirement });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Analysis failed. Check your AI provider key in .env.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
        AI Requirement Analyzer
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Paste a Jira ticket description or raw requirement to get functional/non-functional
        breakdowns, edge cases, risks, and open questions.
      </p>

      <textarea
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
        rows={8}
        placeholder="Paste requirement, acceptance criteria, or ticket description here..."
        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-medium transition mb-6"
      >
        {loading ? "Analyzing..." : "Analyze Requirement"}
      </button>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-6">{error}</p>
      )}

      {result && (
        <div className="grid md:grid-cols-2 gap-4">
          {SECTIONS.map(([key, label]) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-5"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {label}
              </h3>
              {result[key]?.length ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  {result[key].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">None identified</p>
              )}
            </div>
          ))}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Testing Strategy
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {result.testingStrategy}
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}
