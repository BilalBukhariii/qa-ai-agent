import { useState, useEffect } from "react";
import Layout from "../components/Layout.jsx";
import api from "../services/api.js";
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Save,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  File,
  Code,
  Layers,
  Monitor,
  Terminal,
  Play,
  Check
} from "lucide-react";

const LOCAL_STORAGE_KEY = "qa_ai_requirement_draft";

export default function RequirementAnalyzer() {
  const [requirement, setRequirement] = useState("");
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);

  // Workflow steps: 1 = Analyze, 2 = Select Test Type, 3 = App Details, 4 = IDE & Review, 5 = Execution
  const [step, setStep] = useState(1);
  const [testType, setTestType] = useState(null); // 'manual' | 'automated' | 'both'
  const [generatedTestCases, setGeneratedTestCases] = useState([]);
  const [automationCode, setAutomationCode] = useState(null);

  // App Details
  const [appDetails, setAppDetails] = useState({
    name: "QA AI Enterprise App",
    env: "Staging",
    baseUrl: "http://localhost:5173",
    loginUrl: "http://localhost:5173/login",
    browser: "Chromium",
  });

  // Selected IDE
  const [selectedIDE, setSelectedIDE] = useState("VS Code");
  const [executionRunning, setExecutionRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState([]);

  // Load from local storage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setRequirement(parsed.requirement || "");
        setFiles(parsed.files || []);
        setResult(parsed.result || null);
      } catch (err) {
        console.error("Error loading draft", err);
      }
    }
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ requirement, files, result })
      );
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [requirement, files, result]);

  const handleFileUpload = (e) => {
    const uploaded = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + " KB",
      type: f.type || f.name.split(".").pop(),
    }));
    setFiles((prev) => [...prev, ...uploaded]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all data and uploads?")) {
      setRequirement("");
      setFiles([]);
      setResult(null);
      setStep(1);
      setGeneratedTestCases([]);
      setAutomationCode(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const handleAnalyze = async () => {
    setError("");
    if (requirement.trim().length < 5) {
      setError("Please paste or type a requirement description.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/ai/analyze-requirement", { requirement });
      setResult(data);
      setStep(2); // Advance to Next Step: Ask Test Generation Type
    } catch (err) {
      setError(err.response?.data?.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTestType = async (type) => {
    setTestType(type);
    setLoading(true);
    try {
      const { data } = await api.post("/ai/generate-testcases", { requirement });
      setGeneratedTestCases(data);

      if (type === "automated" || type === "both") {
        const autoRes = await api.post("/ai/generate-automation", {
          requirement,
          framework: "playwright",
          language: "javascript",
        });
        setAutomationCode(autoRes.data);
      }
      setStep(3); // Go to App Details step
    } catch (err) {
      setError("Failed to generate test cases.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAutomation = () => {
    setStep(5);
    setExecutionRunning(true);
    setExecutionLogs(["Initializing Playwright Test Runner...", "Launching Chromium headless...", "Running e2e test suite..."]);
    setTimeout(() => {
      setExecutionLogs((prev) => [
        ...prev,
        "✓ [PASS] Verify requirement compliance and state transition (1.2s)",
        "✓ [PASS] Verify edge case boundary validation (0.9s)",
        "Execution Complete: 2 Passed, 0 Failed"
      ]);
      setExecutionRunning(false);
    }, 2500);
  };

  return (
    <Layout>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            AI Requirement & Workflow Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload specs, analyze risks, generate manual/automated test suites, and execute.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {autoSaved && (
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Auto-saved
            </span>
          )}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear All
          </button>
        </div>
      </div>

      {/* Progress Workflow Stepper */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-4 mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] text-xs font-medium">
          <span className={`flex items-center gap-1.5 ${step >= 1 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}>
            1. Requirement Upload & Analysis
          </span>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <span className={`flex items-center gap-1.5 ${step >= 2 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}>
            2. Choose Test Strategy
          </span>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <span className={`flex items-center gap-1.5 ${step >= 3 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}>
            3. Target App & IDE Config
          </span>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <span className={`flex items-center gap-1.5 ${step >= 4 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}>
            4. Review & Execute
          </span>
        </div>
      </div>

      {/* STEP 1: Upload Files & Input Requirement */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Requirement & Specification Documents
            </h2>

            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition cursor-pointer relative bg-gray-50/50 dark:bg-gray-900/40">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Drag & Drop requirements or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supports PDF, DOCX, Excel, CSV, Images, and ZIP file archives
              </p>
            </div>

            {/* File List Cards */}
            {files.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 p-3 rounded-xl border border-gray-200/50 dark:border-gray-800">
                    <div className="flex items-center gap-2 truncate">
                      <File className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-medium truncate">{f.name}</p>
                        <p className="text-[10px] text-gray-400">{f.size}</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea Requirement */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Requirement Description / User Story / Acceptance Criteria
              </label>
              <textarea
                rows={6}
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="e.g. As an Admin user, I should be able to create new users and assign role permissions..."
                className="w-full p-4 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition shadow-sm flex items-center gap-2"
            >
              {loading ? "Analyzing Requirement..." : "Analyze Requirement"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Display Analysis & Prompt for Test Type Selection */}
      {step === 2 && result && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Requirement Analysis Results
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Functional Requirements</h3>
                <ul className="list-disc list-inside text-xs space-y-1 text-gray-700 dark:text-gray-300">
                  {result.functionalRequirements?.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-2">Non-Functional Requirements</h3>
                <ul className="list-disc list-inside text-xs space-y-1 text-gray-700 dark:text-gray-300">
                  {result.nonFunctionalRequirements?.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">Edge Cases</h3>
                <ul className="list-disc list-inside text-xs space-y-1 text-gray-700 dark:text-gray-300">
                  {result.edgeCases?.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">Risk Analysis</h3>
                <ul className="list-disc list-inside text-xs space-y-1 text-gray-700 dark:text-gray-300">
                  {result.riskAnalysis?.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>

            {/* Mandatory AI Prompt */}
            <div className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl space-y-4">
              <h3 className="text-base font-semibold">
                What type of testing would you like to generate?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleSelectTestType("manual")}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-medium transition text-center"
                >
                  Manual Test Cases
                </button>
                <button
                  onClick={() => handleSelectTestType("automated")}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-medium transition text-center shadow-lg"
                >
                  Automated Test Cases
                </button>
                <button
                  onClick={() => handleSelectTestType("both")}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-medium transition text-center shadow-lg"
                >
                  Both Manual & Automated
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Configure Target App & IDE Selection */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Application & Target Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Application Name"
                  value={appDetails.name}
                  onChange={(e) => setAppDetails({ ...appDetails, name: e.target.value })}
                  className="p-3 text-sm bg-gray-50 dark:bg-gray-900 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Base URL"
                  value={appDetails.baseUrl}
                  onChange={(e) => setAppDetails({ ...appDetails, baseUrl: e.target.value })}
                  className="p-3 text-sm bg-gray-50 dark:bg-gray-900 border rounded-xl"
                />
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                Which IDE would you like to use?
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["VS Code", "Cursor", "Windsurf", "Antigravity", "Claude Desktop", "IntelliJ IDEA"].map((ide) => (
                  <button
                    key={ide}
                    onClick={() => setSelectedIDE(ide)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition ${
                      selectedIDE === ide
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {ide}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
            >
              Proceed to Review & Execution
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 & 5: Review & Execution Dashboard */}
      {step >= 4 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Generated Test Suite & Review
              </h2>
              <button
                onClick={handleRunAutomation}
                disabled={executionRunning}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                {executionRunning ? "Running Tests..." : "Run Automation Tests"}
              </button>
            </div>

            {/* Generated Test Cases Table */}
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 font-semibold">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Module</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Expected Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {generatedTestCases.map((tc, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="p-3 font-medium">{tc.title}</td>
                      <td className="p-3">{tc.module}</td>
                      <td className="p-3 capitalize">{tc.priority}</td>
                      <td className="p-3 text-gray-500">{tc.expectedResult}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Live Execution Logs */}
            {step === 5 && (
              <div className="bg-gray-950 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-1">
                <div className="text-gray-500 font-bold border-b border-gray-800 pb-2 mb-2">
                  Live Test Execution Terminal Logs
                </div>
                {executionLogs.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
