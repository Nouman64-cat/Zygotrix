import React from "react";
import { MdTrendingUp } from "react-icons/md";
import { FaDatabase } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";

type TabId =
    | "overview"
    | "cache"
    | "embeddings"
    | "deep_research"
    | "web_search"
    | "scholar_mode";

interface TabNavigationProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
    activeTab,
    onTabChange,
}) => {
    const tabs = [
        {
            id: "overview",
            label: "Token Usage",
            icon: <MdTrendingUp className="w-5 h-5" />,
            activeColor: "border-indigo-500 text-indigo-600 dark:text-indigo-400",
        },
        {
            id: "cache",
            label: "Cache Analytics",
            icon: <FaDatabase className="w-5 h-5" />,
            activeColor: "border-indigo-500 text-indigo-600 dark:text-indigo-400",
        },
        {
            id: "embeddings",
            label: "Embeddings",
            icon: <HiSparkles className="w-5 h-5" />,
            activeColor: "border-indigo-500 text-indigo-600 dark:text-indigo-400",
        },
        {
            id: "deep_research",
            label: "Deep Research",
            icon: <span className="text-lg">🔬</span>,
            activeColor: "border-emerald-500 text-emerald-600 dark:text-emerald-400",
        },
        {
            id: "web_search",
            label: "Web Search",
            icon: <span className="text-lg">🌐</span>,
            activeColor: "border-blue-500 text-blue-600 dark:text-blue-400",
        },
        {
            id: "scholar_mode",
            label: "Scholar Mode",
            icon: <span className="text-lg">🎓</span>,
            activeColor: "border-purple-500 text-purple-600 dark:text-purple-400",
        },
    ];

    return (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as TabId)}
                        className={`${activeTab === tab.id
                                ? tab.activeColor
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default TabNavigation;
