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
  <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
    <div className="flex items-center space-x-3">
      {leftIcon && <div>{leftIcon}</div>}
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    </div>
    {rightActions && (
      <div className="flex items-center space-x-3">{rightActions}</div>
    )}
  </div>
);

export default HeaderBar;
