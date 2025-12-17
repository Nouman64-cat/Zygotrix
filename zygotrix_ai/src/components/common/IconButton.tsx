import React from 'react';
import { cn } from '../../utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'filled';
  tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'ghost',
  tooltip,
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'p-1.5 text-base',
    md: 'p-2 text-lg',
    lg: 'p-2.5 text-xl',
  };

  const variantStyles = {
    ghost: 'hover:bg-gray-100 active:bg-gray-200 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700',
    filled: 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 dark:text-gray-100',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      title={tooltip}
      {...props}
    >
      {icon}
    </button>
  );
};
