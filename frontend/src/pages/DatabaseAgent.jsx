import { useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../services/api.js";
import { Database, Terminal, Check, Copy } from "lucide-react";

export default function DatabaseAgent() {
  const [requirement, setRequirement] = useState("");
  const [dbResult, setDbResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!requirement.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/ai/generate-database", { requirement });
      setDbResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-500" />
            AI Database & Query Generator
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate MongoDB aggregations, SQL joins, updates, and verification scripts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 lg:col-span-1 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Feature / Data Verification Requirement
          </label>
          <textarea
            rows={8}
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="e.g. Verify user subscription status update across users and transactions tables..."
            className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? "Generating Queries..." : "Generate DB Verification Queries"}
          </button>
        </div>

        <div className="bg-gray-900 text-gray-100 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4 font-mono">
          {dbResult ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                  MongoDB & SQL Queries
                </span>
                <button
                  onClick={() => copyText(dbResult.sqlQueries?.join("\n\n") || "")}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1 rounded-lg"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy SQL"}
                </button>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">// Relational SQL Queries (MySQL / SQL Server)</p>
                <pre className="text-xs bg-gray-950 p-4 rounded-xl overflow-x-auto text-emerald-400">
                  {dbResult.sqlQueries?.join("\n\n")}
                </pre>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">// MongoDB Aggregation / Commands</p>
                <pre className="text-xs bg-gray-950 p-4 rounded-xl overflow-x-auto text-indigo-300">
                  {dbResult.mongoQueries?.join("\n\n")}
                </pre>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-gray-500">
              <Terminal className="w-12 h-12 mb-3 text-gray-700" />
              <p className="text-sm">Describe scenario and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
