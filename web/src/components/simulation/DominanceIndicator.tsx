import type { DominancePattern } from "../../services/cppEngine.api";

export const dominancePalette: Record<
    DominancePattern,
    {
        label: string;
        badge: string;
        dot: string;
        text: string;
    }
> = {
    complete: {
        label: "Complete",
        badge:
            "border border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300",
        dot: "bg-emerald-500 dark:bg-emerald-400",
        text: "text-emerald-600 dark:text-emerald-400",
    },
    codominant: {
        label: "Codominant",
        badge:
            "border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
        dot: "bg-amber-500 dark:bg-amber-400",
        text: "text-amber-600 dark:text-amber-400",
    },
    incomplete: {
        label: "Incomplete",
        badge:
            "border border-violet-300 dark:border-violet-700 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300",
        dot: "bg-violet-500 dark:bg-violet-400",
        text: "text-violet-600 dark:text-violet-400",
    },
};

interface DominanceIndicatorProps {
    pattern: DominancePattern;
    variant?: "pill" | "dot";
    showLabel?: boolean;
    className?: string;
}

const DominanceIndicator: React.FC<DominanceIndicatorProps> = ({
    pattern,
    variant = "pill",
    showLabel = false,
    className = "",
}) => {
    const palette = dominancePalette[pattern];
    if (!palette) {
        return null;
    }

    if (variant === "dot") {
        return (
            <span
                className={`inline-flex items-center gap-1 ${palette.text} ${className}`}
                title={`${pattern.charAt(0).toUpperCase() + pattern.slice(1)
                    } Dominance`}
            >
                <span
                    className={`h-2 w-2 rounded-full ${palette.dot}`}
                    aria-hidden="true"
                />
                {showLabel ? (
                    <span className="text-[9px] font-medium">{palette.label}</span>
                ) : (
                    <span className="sr-only">{palette.label}</span>
                )}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${palette.badge} ${className}`}
            title={`${pattern.charAt(0).toUpperCase() + pattern.slice(1)} Dominance`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${palette.dot}`}
                aria-hidden="true"
            />
            {showLabel ? (
                <span>{palette.label}</span>
            ) : (
                <span className="sr-only">{palette.label}</span>
            )}
        </span>
    );
};

export default DominanceIndicator;