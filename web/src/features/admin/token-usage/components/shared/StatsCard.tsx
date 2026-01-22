import React, { type ReactNode } from "react";

interface StatsCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: ReactNode;
    iconBgColor?: string; // e.g. "bg-indigo-100 dark:bg-indigo-500/20"
    iconColor?: string; // e.g. "text-indigo-500 dark:text-indigo-400"
    valueColor?: string; // e.g. "text-gray-900 dark:text-white"
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    subtext,
    icon,
    iconBgColor = "bg-indigo-100 dark:bg-indigo-500/20",
    // We can pass the className directly to the icon if we clone it, or just wrap it. 
    // But usually the icon is passed as a component instance <FaIcon className="..." />. 
    // However, specifically in the original code, the wrapper div has the color.
    // Let's stick to passing the wrapper classes.
    valueColor = "text-gray-900 dark:text-white",
}) => {
    return (
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                <div className={`p-1.5 sm:p-2 rounded-lg ${iconBgColor}`}>
                    {icon}
                </div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                    {title}
                </span>
            </div>
            <div className={`text-xl sm:text-3xl font-bold ${valueColor} mb-1`}>
                {value}
            </div>
            {subtext && (
                <div className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500">
                    {subtext}
                </div>
            )}
        </div>
    );
};

export default StatsCard;
