import React from "react";
import { useTheme } from "../../context/ThemeContext";

const ThemeDebugger: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const documentClasses = Array.from(document.documentElement.classList);
  const hasLocalStorage = localStorage.getItem("zygotrix_theme");

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-xl p-4 z-50 max-w-md">
      <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">
        Theme Debugger
      </h3>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">Current Theme:</span>{" "}
          <span className="text-blue-600 dark:text-blue-400">{theme}</span>
        </div>

        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">Resolved Theme:</span>{" "}
          <span className="text-purple-600 dark:text-purple-400">{resolvedTheme}</span>
        </div>

        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">localStorage:</span>{" "}
          <span className="text-green-600 dark:text-green-400">{hasLocalStorage || "null"}</span>
        </div>

        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">Document Classes:</span>{" "}
          <span className="text-orange-600 dark:text-orange-400">
            [{documentClasses.join(", ") || "none"}]
          </span>
        </div>

        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">Has 'dark' class:</span>{" "}
          <span className={documentClasses.includes("dark") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
            {documentClasses.includes("dark") ? "YES ✓" : "NO ✗"}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">Quick Test:</p>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme("light")}
            className="px-3 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800"
          >
            Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className="px-3 py-1 text-xs bg-slate-700 dark:bg-slate-600 text-white rounded cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-500"
          >
            Dark
          </button>
          <button
            onClick={() => setTheme("auto")}
            className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
          >
            Auto
          </button>
        </div>
      </div>

      <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs">
        <p className="text-slate-700 dark:text-slate-300">
          This box should change colors when dark mode is active. Background should be dark slate in dark mode.
        </p>
      </div>
    </div>
  );
};

export default ThemeDebugger;
