import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface AccentButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  to?: string;
  icon?: ReactNode;
  children: ReactNode;
}

const baseStyles =
  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:brightness-110 focus-visible:ring-indigo-400 focus-visible:ring-offset-slate-900",
  secondary:
    "bg-white/10 text-white hover:bg-white/16 focus-visible:ring-white/40 focus-visible:ring-offset-slate-900",
  ghost:
    "bg-transparent text-slate-200 hover:bg-white/10 focus-visible:ring-white/30 focus-visible:ring-offset-slate-900",
};

const AccentButton = ({
  variant = "primary",
  to,
  icon,
  className,
  children,
  ...rest
}: AccentButtonProps) => {
  if (to) {
    return (
      <Link
        to={to}
        className={cn(baseStyles, variantStyles[variant], "inline-flex", className)}
        {...(rest as Record<string, unknown>)}
      >
        <span>{children}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </Link>
    );
  }

  return (
    <button className={cn(baseStyles, variantStyles[variant], className)} {...rest}>
      <span>{children}</span>
      {icon && <span className="text-lg">{icon}</span>}
    </button>
  );
};

export default AccentButton;
