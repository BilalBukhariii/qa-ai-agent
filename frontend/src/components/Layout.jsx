import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import {
  LayoutDashboard,
  FileSearch,
  Sparkles,
  TestTube2,
  Cpu,
  Database,
  MessageSquare,
  Sun,
  Moon,
  LogOut,
  ShieldCheck
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/test-cases", label: "Test Cases", icon: TestTube2 },
  { to: "/requirement-analyzer", label: "Requirement Analyzer", icon: FileSearch },
  { to: "/test-case-generator", label: "AI Test Generator", icon: Sparkles },
  { to: "/automation-agent", label: "Automation Agent", icon: Cpu },
  { to: "/database-agent", label: "DB Query Agent", icon: Database },
  { to: "/ai-chat", label: "AI Copilot Chat", icon: MessageSquare },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 flex flex-col justify-between">
        <div>
          {/* Logo / Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold">
                QA
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white leading-none">
                  Enterprise QA
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  AI Agent Platform
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Footer & Theme Controls */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          >
            <span className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800">
              Toggle
            </span>
          </button>

          {/* User Profile Info */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-xs border border-indigo-200 dark:border-indigo-800">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="max-w-[110px] truncate">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || "QA Engineer"}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize truncate flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-indigo-500" />
                  {user?.role || "Admin"}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace View */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
