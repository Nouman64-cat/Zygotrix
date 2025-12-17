import React from 'react';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import { useTheme } from '../../contexts';
import { cn } from '../../utils';

interface ThemeSwitcherProps {
    variant?: 'icon' | 'dropdown' | 'toggle';
    className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
    variant = 'toggle',
    className,
}) => {
    const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

    if (variant === 'icon') {
        return (
            <button
                onClick={toggleTheme}
                className={cn(
                    'p-2 rounded-lg transition-all duration-200',
                    'text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    className
                )}
                title={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
                {resolvedTheme === 'light' ? (
                    <FiMoon size={20} />
                ) : (
                    <FiSun size={20} />
                )}
            </button>
        );
    }

    if (variant === 'dropdown') {
        const options = [
            { value: 'light' as const, label: 'Light', icon: FiSun },
            { value: 'dark' as const, label: 'Dark', icon: FiMoon },
            { value: 'system' as const, label: 'System', icon: FiMonitor },
        ];

        return (
            <div className={cn('relative', className)}>
                <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                    className={cn(
                        'appearance-none px-3 py-2 pr-8 rounded-lg border',
                        'bg-white dark:bg-gray-800',
                        'border-gray-300 dark:border-gray-600',
                        'text-gray-900 dark:text-gray-100',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        'cursor-pointer'
                    )}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                    {theme === 'light' && <FiSun size={16} />}
                    {theme === 'dark' && <FiMoon size={16} />}
                    {theme === 'system' && <FiMonitor size={16} />}
                </div>
            </div>
        );
    }

    // Toggle variant (default) - segmented control style
    const options = [
        { value: 'light' as const, icon: FiSun, label: 'Light' },
        { value: 'dark' as const, icon: FiMoon, label: 'Dark' },
        { value: 'system' as const, icon: FiMonitor, label: 'System' },
    ];

    return (
        <div
            className={cn(
                'inline-flex rounded-lg p-1',
                'bg-gray-100 dark:bg-gray-800',
                className
            )}
        >
            {options.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;

                return (
                    <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                            isActive
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        )}
                        title={option.label}
                    >
                        <Icon size={16} />
                        <span className="hidden sm:inline">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
