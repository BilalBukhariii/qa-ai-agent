import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-100 dark:border-gray-700">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    api
      .get("/testcases")
      .then((res) => setTestCases(res.data))
      .catch(() => setTestCases([]))
      .finally(() => setLoading(false));
  }, []);

  const passed = testCases.filter((t) => t.status === "pass").length;
  const failed = testCases.filter((t) => t.status === "fail").length;
  const pending = testCases.filter((t) => t.status === "not_run").length;

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            QA Dashboard
          </h1>
          <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          Sign out
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Test Cases" value={testCases.length} accent="text-gray-900 dark:text-white" />
        <StatCard label="Passed" value={passed} accent="text-emerald-500" />
        <StatCard label="Failed" value={failed} accent="text-red-500" />
        <StatCard label="Pending" value={pending} accent="text-amber-500" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="3" className="px-4 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && testCases.length === 0 && (
              <tr>
                <td colSpan="3" className="px-4 py-6 text-center text-gray-400">
                  No test cases yet. Create one via POST /api/testcases.
                </td>
              </tr>
            )}
            {testCases.map((tc) => (
              <tr key={tc._id} className="border-t border-gray-100 dark:border-gray-700">
                <td className="px-4 py-3">{tc.title}</td>
                <td className="px-4 py-3 capitalize">{tc.priority}</td>
                <td className="px-4 py-3 capitalize">{tc.status.replace("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
