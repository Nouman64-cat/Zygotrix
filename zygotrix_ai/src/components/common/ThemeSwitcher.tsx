import React from 'react';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import { useTheme } from '../../contexts';
import { cn } from '../../utils';

interface ThemeSwitcherProps {
    variant?: 'icon' | 'dropdown' | 'toggle' | 'cards';
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

    // Cards variant - visual theme preview cards like Claude
    if (variant === 'cards') {
        const options = [
            { value: 'light' as const, label: 'Light', bgColor: 'bg-white', headerColor: 'bg-gray-100', contentColor: 'bg-gray-50' },
            { value: 'system' as const, label: 'Auto', bgColor: 'bg-gradient-to-r from-white to-gray-800', headerColor: 'bg-gradient-to-r from-gray-100 to-gray-700', contentColor: 'bg-gradient-to-r from-gray-50 to-gray-800' },
            { value: 'dark' as const, label: 'Dark', bgColor: 'bg-gray-900', headerColor: 'bg-gray-800', contentColor: 'bg-gray-850' },
        ];

        return (
            <div className={cn('flex gap-4', className)}>
                {options.map((option) => {
                    const isActive = theme === option.value;

                    return (
                        <button
                            key={option.value}
                            onClick={() => setTheme(option.value)}
                            className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                            {/* Theme Preview Card */}
                            <div
                                className={cn(
                                    'relative w-24 h-16 sm:w-28 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200',
                                    isActive
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                        : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                                )}
                            >
                                {/* Card background */}
                                <div className={cn('absolute inset-0', option.bgColor)} />
                                
                                {/* Mini UI representation */}
                                <div className="absolute inset-0 p-1.5">
                                    {/* Header bar */}
                                    <div className={cn(
                                        'h-2.5 rounded-sm mb-1',
                                        option.value === 'light' ? 'bg-gray-200' : 
                                        option.value === 'dark' ? 'bg-gray-700' : 
                                        'bg-gradient-to-r from-gray-200 to-gray-700'
                                    )} />
                                    {/* Content lines */}
                                    <div className="space-y-1">
                                        <div className={cn(
                                            'h-1.5 w-3/4 rounded-sm',
                                            option.value === 'light' ? 'bg-gray-300' : 
                                            option.value === 'dark' ? 'bg-gray-600' : 
                                            'bg-gradient-to-r from-gray-300 to-gray-600'
                                        )} />
                                        <div className={cn(
                                            'h-1.5 w-1/2 rounded-sm',
                                            option.value === 'light' ? 'bg-gray-300' : 
                                            option.value === 'dark' ? 'bg-gray-600' : 
                                            'bg-gradient-to-r from-gray-300 to-gray-600'
                                        )} />
                                        <div className={cn(
                                            'h-1.5 w-2/3 rounded-sm',
                                            option.value === 'light' ? 'bg-gray-300' : 
                                            option.value === 'dark' ? 'bg-gray-600' : 
                                            'bg-gradient-to-r from-gray-300 to-gray-600'
                                        )} />
                                    </div>
                                </div>

                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                                )}
                            </div>

                            {/* Label */}
                            <span className={cn(
                                'text-sm font-medium transition-colors',
                                isActive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                            )}>
                                {option.label}
                            </span>
                        </button>
                    );
                })}
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

