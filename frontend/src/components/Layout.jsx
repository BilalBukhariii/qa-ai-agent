import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/requirement-analyzer", label: "Requirement Analyzer" },
  { to: "/test-case-generator", label: "AI Test Case Generator" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <aside className="w-60 shrink-0 border-r border-gray-200 dark:border-gray-700 p-5 flex flex-col">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-8">
          QA AI Agent
        </h1>
        <nav className="flex flex-col gap-1 flex-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 mb-1">{user?.name}</p>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-red-500"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
    </div>
  );
}
