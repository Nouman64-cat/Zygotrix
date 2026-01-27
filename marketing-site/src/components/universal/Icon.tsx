import React, { type ReactNode, type ReactElement } from "react";

export type IconKey =
    | "dna"
    | "network"
    | "chart"
    | "shield"
    | "spark"
    | "layers";

type IconProps = {
    name: IconKey;
    className?: string;
};

type IconRenderer = (className?: string) => ReactElement;

const createIcon = (paths: ReactNode): IconRenderer => {
    return (className) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-6 w-6 ${className ?? ""}`.trim()}
        >
            {paths}
        </svg>
    );
};

const iconRenderers: Record<IconKey, IconRenderer> = {
    dna: createIcon(
        <>
            <path d="M8 4c3 3 4 6 8 7" />
            <path d="M16 20c-3-3-4-6-8-7" />
            <path d="M8 7h8" />
            <path d="M8 11h8" />
            <path d="M8 15h8" />
        </>
    ),
    network: createIcon(
        <>
            <path d="M12 3v6" />
            <path d="M12 15v6" />
            <circle cx="12" cy="12" r="2.5" />
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="18" cy="6" r="2.5" />
            <circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="18" r="2.5" />
            <path d="M7.8 7.8l3.4 3.4M16.2 7.8l-3.4 3.4M7.8 16.2l3.4-3.4M16.2 16.2l-3.4-3.4" />
        </>
    ),
    chart: createIcon(
        <>
            <path d="M4 20h16" />
            <rect x="5.5" y="11" width="3" height="6.5" rx="1" />
            <rect x="10.5" y="7" width="3" height="10.5" rx="1" />
            <rect x="15.5" y="13" width="3" height="4.5" rx="1" />
        </>
    ),
    shield: createIcon(
        <>
            <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
            <path d="M9 12l2 2 4-4" />
        </>
    ),
    spark: createIcon(
        <>
            <path d="M12 3v4" />
            <path d="M12 17v4" />
            <path d="M4.22 5.22l2.83 2.83" />
            <path d="M16.95 17.95l2.83 2.83" />
            <path d="M3 12h4" />
            <path d="M17 12h4" />
            <path d="M4.22 18.78l2.83-2.83" />
            <path d="M16.95 6.05l2.83-2.83" />
            <path d="M9.5 9.5l5 5" />
            <path d="M14.5 9.5l-5 5" />
        </>
    ),
    layers: createIcon(
        <>
            <path d="M12 3l9 5-9 5-9-5 9-5z" />
            <path d="M3 12l9 5 9-5" />
            <path d="M3 17l9 5 9-5" />
        </>
    ),
};

export const Icon: React.FC<IconProps> = ({ name, className }) => iconRenderers[name](className);
