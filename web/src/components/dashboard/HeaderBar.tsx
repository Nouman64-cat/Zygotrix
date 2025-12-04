import React from "react";

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightActions?: React.ReactNode;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  leftIcon,
  rightActions,
}) => (
  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
    <div className="flex items-center space-x-3">
      {leftIcon && <div>{leftIcon}</div>}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {rightActions && (
      <div className="flex items-center space-x-3">{rightActions}</div>
    )}
  </div>
);

export default HeaderBar;
