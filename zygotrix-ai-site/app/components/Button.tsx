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

    const baseStyles = "relative inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer overflow-hidden group";

    const variants = {
        primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 border border-transparent",
        secondary: "bg-slate-800 text-white hover:bg-slate-700 hover:scale-105 border border-slate-700",
        outline: "bg-transparent border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400",
        ghost: "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
        glow: "bg-slate-900 text-white border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.8)] hover:border-blue-400"
    };

    const sizes = {
        sm: "text-sm px-4 py-1.5",
        md: "text-base px-6 py-2.5",
        lg: "text-lg px-8 py-3.5"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
        </button>
    );
};

export default Button;
