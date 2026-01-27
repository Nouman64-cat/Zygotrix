import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glow';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

const Button = ({
    className = '',
    variant = 'primary',
    size = 'md',
    children,
    ...props
}: ButtonProps) => {

    const baseStyles = "relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer overflow-hidden group";

    const variants = {
        primary: "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:scale-105 border border-transparent dark:bg-emerald-600 dark:hover:bg-emerald-700",
        secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300 hover:scale-105 border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600",
        outline: "bg-transparent border-2 border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400",
        ghost: "bg-transparent text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800",
        glow: "bg-slate-900 text-white border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.8)] hover:border-emerald-400"
    };

    const sizes = {
        sm: "text-sm px-5 py-2.5",
        md: "text-base px-7 py-3.5",
        lg: "text-lg px-9 py-4.5"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>

        </button>
    );
};

export default Button;
