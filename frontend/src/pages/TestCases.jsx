import { useEffect, useState } from "react";
import api from "../services/api.js";
import Layout from "../components/Layout.jsx";
import { Plus, Trash2, Edit3, CheckCircle2, XCircle, Clock, Save, X } from "lucide-react";

export default function TestCases() {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for New Test Case
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newModule, setNewModule] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.post("/testcases", {
        title: newTitle,
        module: newModule || "General",
        priority: newPriority,
        status: "not_run",
      });
      setTestCases([res.data, ...testCases]);
      setNewTitle("");
      setNewModule("");
      setNewPriority("medium");
      setShowModal(false);
    } catch (err) {
      console.error("Failed to create test case", err);
    }
  };

  const handleSaveTitle = async (id) => {
    try {
      const res = await api.put(`/testcases/${id}`, { title: editTitle });
      setTestCases((prev) =>
        prev.map((tc) => (tc._id === id ? { ...tc, title: res.data.title } : tc))
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update test case title", err);
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

  return (
    <Layout>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test Case Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create, update, and manage your automated test case repository
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Test Case
        </button>
      </div>

      {/* Modal for creating a new test case */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                New Test Case
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify user login with valid credentials"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Module
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authentication"
                  value={newModule}
                  onChange={(e) => setNewModule(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-300"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
                >
                  Save Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Table Listing */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-900/40 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3.5">Title (Editable)</th>
              <th className="px-6 py-3.5">Module</th>
              <th className="px-6 py-3.5">Priority</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {loading && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                  Loading test cases...
                </td>
              </tr>
            )}
            {!loading && testCases.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                  No test cases found. Click "Create Test Case" to add one.
                </td>
              </tr>
            )}
            {testCases.map((tc) => (
              <tr key={tc._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {editingId === tc._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-indigo-500 rounded-lg focus:outline-none w-full"
                      />
                      <button
                        onClick={() => handleSaveTitle(tc._id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span>{tc.title}</span>
                      <button
                        onClick={() => {
                          setEditingId(tc._id);
                          setEditTitle(tc.title);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {tc.module || "General"}
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
                <td className="px-6 py-4 capitalize">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold">
                    {tc.status === "pass" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    {tc.status === "fail" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    {(!tc.status || tc.status === "not_run") && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    {tc.status ? tc.status.replace("_", " ") : "Not Run"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(tc._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
