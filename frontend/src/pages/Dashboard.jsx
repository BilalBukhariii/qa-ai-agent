import { useEffect, useState } from "react";
import api from "../services/api.js";
import Layout from "../components/Layout.jsx";
import Chart from "react-apexcharts";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Check,
  Edit2,
  Trash2,
  Plus
} from "lucide-react";

function StatCard({ label, value, icon: Icon, accent, bgAccent }) {
  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-400">
          {label}
        </p>
        <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${bgAccent}`}>
        <Icon className={`w-6 h-6 ${accent}`} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTestCases = async () => {
    setLoading(true);
    try {
      const res = await api.get("/testcases");
      setTestCases(res.data);
    } catch {
      setTestCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestCases();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.put(`/testcases/${id}`, { status: newStatus });
      setTestCases((prev) =>
        prev.map((tc) => (tc._id === id ? { ...tc, status: res.data.status } : tc))
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update test case status", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test case?")) return;
    try {
      await api.delete(`/testcases/${id}`);
      setTestCases((prev) => prev.filter((tc) => tc._id !== id));
    } catch (err) {
      console.error("Failed to delete test case", err);
    }
  };

  const passed = testCases.filter((t) => t.status === "pass").length;
  const failed = testCases.filter((t) => t.status === "fail").length;
  const pending = testCases.filter((t) => t.status === "not_run" || !t.status).length;
  const total = testCases.length;

  const filteredTestCases = testCases.filter((tc) => {
    const matchesSearch = tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tc.module && tc.module.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || tc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Chart configuration for status distribution
  const chartOptions = {
    chart: { type: "donut", background: "transparent" },
    labels: ["Passed", "Failed", "Pending"],
    colors: ["#10b981", "#ef4444", "#f59e0b"],
    legend: { position: "bottom", labels: { colors: "#9ca3af" } },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Tests",
              color: "#9ca3af",
              formatter: () => total,
            },
          },
        },
      },
    },
  };

  const chartSeries = [passed, failed, pending];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            QA Automation Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time test suite execution status & AI analytics
          </p>
        </div>
        <button
          onClick={fetchTestCases}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Test Cases"
          value={total}
          icon={Layers}
          accent="text-gray-900 dark:text-white"
          bgAccent="bg-gray-100 dark:bg-gray-700/50"
        />
        <StatCard
          label="Passed"
          value={passed}
          icon={CheckCircle2}
          accent="text-emerald-500"
          bgAccent="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          label="Failed"
          value={failed}
          icon={XCircle}
          accent="text-red-500"
          bgAccent="bg-red-50 dark:bg-red-950/40"
        />
        <StatCard
          label="Pending Execution"
          value={pending}
          icon={Clock}
          accent="text-amber-500"
          bgAccent="bg-amber-50 dark:bg-amber-950/40"
        />
      </div>

      {/* Analytics Chart & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 lg:col-span-1 flex flex-col justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Test Execution Breakdown
          </h2>
          {total > 0 ? (
            <Chart options={chartOptions} series={chartSeries} type="donut" height={280} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No test case data available
            </div>
          )}
        </div>

        {/* AI QA Insights Box */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              AI Quality Health Analysis
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {failed === 0 ? "All Core Suites Passing Optimally" : `${failed} High Priority Failures Detected`}
            </h3>
            <p className="text-sm text-gray-300 max-w-xl leading-relaxed">
              {failed === 0
                ? "Your automated test suites maintain a 100% pass rate across authentication, checkout, and API routes."
                : "AI analysis suggests reviewing auth token handling and pre-save hooks to resolve authentication errors."}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-indigo-800/60 flex items-center justify-between relative z-10">
            <span className="text-xs text-indigo-300">
              Automation Health Score: <strong className="text-white font-bold">{total > 0 ? Math.round((passed / total) * 100) : 100}%</strong>
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              Agent Ready
            </span>
          </div>
        </div>
      </div>

      {/* Editable Test Cases Data Table */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
        {/* Table Filters & Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Active Test Suite Registry
          </h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search test cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-300"
            >
              <option value="all">All Status</option>
              <option value="pass">Passed</option>
              <option value="fail">Failed</option>
              <option value="not_run">Pending</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-900/40 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Module</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Status (Editable)</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    Loading test registry...
                  </td>
                </tr>
              )}
              {!loading && filteredTestCases.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    No test cases match the criteria.
                  </td>
                </tr>
              )}
              {filteredTestCases.map((tc) => (
                <tr key={tc._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {tc.title}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {tc.module || "Authentication"}
                  </td>
                  <td className="px-6 py-4 capitalize">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        tc.priority === "high"
                          ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                          : tc.priority === "medium"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      }`}
                    >
                      {tc.priority || "Medium"}
                    </span>
                  </td>

                  {/* Editable Status Cell */}
                  <td className="px-6 py-4">
                    {editingId === tc._id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="px-2 py-1 text-xs border rounded-lg bg-white dark:bg-gray-800 border-indigo-500 focus:outline-none"
                        >
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                          <option value="not_run">Not Run</option>
                        </select>
                        <button
                          onClick={() => handleUpdateStatus(tc._id, editStatus)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(tc._id);
                          setEditStatus(tc.status || "not_run");
                        }}
                        className="group flex items-center gap-1.5 cursor-pointer"
                        title="Click to edit status"
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            tc.status === "pass"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : tc.status === "fail"
                              ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {tc.status === "pass" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          {tc.status === "fail" && <XCircle className="w-3 h-3 text-red-500" />}
                          {(!tc.status || tc.status === "not_run") && <Clock className="w-3 h-3 text-amber-500" />}
                          {tc.status ? tc.status.replace("_", " ") : "Not Run"}
                        </span>
                        <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(tc._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                      title="Delete Test Case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
