import React, { ReactNode } from "react";

interface FooterItem {
    color: string; // "bg-green-300"
    label: ReactNode;
}

interface HeroStatCardProps {
    title: string;
    subtitle: string;
    value: string;
    valueSubtext: string;
    icon: ReactNode; // e.g. <span className="text-3xl">🔬</span>
    gradient: string; // e.g. "from-emerald-500 via-emerald-600 to-teal-600"
    footerItems: FooterItem[];
    borderColor?: string;
    textColor?: string; // Text color specific overrides if needed, default white
}

const HeroStatCard: React.FC<HeroStatCardProps> = ({
    title,
    subtitle,
    value,
    valueSubtext,
    icon,
    gradient,
    footerItems,
    borderColor = "border-white/30",
}) => {
    return (
        <div
            className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 sm:p-8 shadow-xl border ${borderColor}`}
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white">
                                {title}
                            </h3>
                            <p className="text-white/80 text-sm">{subtitle}</p>
                        </div>
                    </div>
                </div>
                <div className="text-center md:text-right">
                    <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                        {value}
                    </div>
                    <div className="text-white/80 text-sm mt-1">{valueSubtext}</div>
                    <div className="flex items-center justify-center md:justify-end gap-4 mt-3 text-xs text-white/90">
                        {footerItems.map((item, index) => (
                            <span key={index} className="flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                                {item.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroStatCard;
