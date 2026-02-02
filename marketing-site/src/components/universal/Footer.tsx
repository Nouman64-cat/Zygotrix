"use client";

import React, { useState } from "react";
import Link from "next/link";
import { subscribeToNewsletter } from "../../services/newsletter.api";


const footerLinks = [
    {
        heading: "Products",
        links: [
            { label: "DNA Generator", to: "/tools/dna-generator" },
            { label: "Zygotrix AI", to: "/product/ai" },
        ],
    },
    {
        heading: "Resources",
        links: [
            { label: "Documentation", href: "https://docs.zygotrix.com/docs/" },
            { label: "Blogs", to: "/blogs" },
            { label: "Community", href: "https://discord.gg/5qtEfusv" },
        ],
    },
    {
        heading: "Navigation",
        links: [
            { label: "Home", to: "/" },
            { label: "About", to: "/about" },
            { label: "Contact", to: "/contact" },
        ],
    },
    {
        heading: "Legal",
        links: [
            { label: "Privacy Policy", to: "/privacy" },
            { label: "Terms of Service", to: "/terms" },
        ],
    },
];

const socialLinks = [
    {
        name: "Twitter",
        href: "https://x.com/zygotrix",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        name: "GitHub",
        href: "https://github.com/Nouman64-cat/Zygotrix",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                />
            </svg>
        ),
    },
    {
        name: "LinkedIn",
        href: "https://www.linkedin.com/company/zygotrix",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
    },
    {
        name: "Discord",
        href: "https://discord.gg/5qtEfusv",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
            </svg>
        ),
    },
];

const Footer: React.FC = () => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [message, setMessage] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);

    const handleSubscribe = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!email) {
            setMessage({ text: "Please enter a valid email.", type: "error" });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await subscribeToNewsletter(email);
            setMessage({ text: response.message, type: "success" });
            setEmail("");
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.detail ||
                "Failed to subscribe. Please try again.";
            setMessage({ text: errorMessage, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <footer className="relative mt-[-1px] overflow-hidden bg-gray-950 text-slate-200">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top gradient border */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

                {/* Molecular grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20px 20px, #10B981 1px, transparent 1px)`,
                        backgroundSize: "40px 40px",
                    }}
                />

                {/* Floating DNA helix decorations */}
                <div className="absolute -left-20 top-20 w-64 h-64 opacity-[0.08] animate-spin-slow">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <defs>
                            <linearGradient id="footerDnaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                        </defs>
                        <circle cx="20" cy="20" r="3" fill="url(#footerDnaGrad)" />
                        <circle cx="80" cy="20" r="3" fill="url(#footerDnaGrad)" />
                        <circle cx="35" cy="40" r="3" fill="url(#footerDnaGrad)" />
                        <circle cx="65" cy="40" r="3" fill="url(#footerDnaGrad)" />
                        <circle cx="20" cy="60" r="3" fill="url(#footerDnaGrad)" />
                        <circle cx="80" cy="60" r="3" fill="url(#footerDnaGrad)" />
                        <circle cx="35" cy="80" r="3" fill="url(#footerDnaGrad)" />
                        <circle cx="65" cy="80" r="3" fill="url(#footerDnaGrad)" />
                        <line x1="20" y1="20" x2="80" y2="20" stroke="url(#footerDnaGrad)" strokeWidth="1" opacity="0.5" />
                        <line x1="35" y1="40" x2="65" y2="40" stroke="url(#footerDnaGrad)" strokeWidth="1" opacity="0.5" />
                        <line x1="20" y1="60" x2="80" y2="60" stroke="url(#footerDnaGrad)" strokeWidth="1" opacity="0.5" />
                        <line x1="35" y1="80" x2="65" y2="80" stroke="url(#footerDnaGrad)" strokeWidth="1" opacity="0.5" />
                    </svg>
                </div>

                <div className="absolute -right-16 bottom-20 w-48 h-48 opacity-[0.06] animate-float-up">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="0.5" />
                        <circle cx="50" cy="50" r="30" fill="none" stroke="#059669" strokeWidth="0.5" />
                        <circle cx="50" cy="50" r="20" fill="none" stroke="#10B981" strokeWidth="0.5" />
                    </svg>
                </div>

                {/* Graduate overlays */}
                <div className="absolute -left-40 -bottom-40 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px]" />
                <div className="absolute -right-40 -top-40 w-80 h-80 rounded-full bg-emerald-500/5 blur-[100px]" />
            </div>

            {/* Main Footer Content */}
            <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:py-20">
                {/* Top Section - Newsletter CTA */}
                <div className="mb-16 lg:mb-20">
                    <div className={`relative mx-auto max-w-2xl rounded-2xl border transition-all duration-500 ${isFocused
                        ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5"
                        : "border-white/10 bg-white/[0.02]"
                        } p-8 lg:p-10 backdrop-blur-sm`}>
                        {/* Glassmorphism effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                        <div className="relative text-center">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-semibold  text-emerald-500">
                                    Stay Updated
                                </span>
                            </div>

                            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                                <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                                    Join the Genetics Revolution
                                </span>
                            </h3>
                            <p className="text-slate-400 text-sm lg:text-base mb-8 max-w-md mx-auto">
                                Get exclusive insights, release notes, and genetics research updates delivered to your inbox monthly.
                            </p>

                            <form className="mx-auto max-w-md" onSubmit={handleSubscribe}>
                                <div className={`relative flex items-center gap-2 rounded-full p-1.5 transition-all duration-300 ${isFocused
                                    ? "bg-white/10 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20"
                                    : "bg-white/5 ring-1 ring-white/10"
                                    }`}>
                                    <div className="relative flex-1">
                                        <svg
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onFocus={() => setIsFocused(true)}
                                            onBlur={() => setIsFocused(false)}
                                            className="w-full rounded-full bg-transparent pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="group relative inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>Subscribing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Subscribe</span>
                                                <svg
                                                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Status Messages */}
                                <div className="h-6 mt-3">
                                    {message && (
                                        <p className={`text-sm flex items-center justify-center gap-2 animate-fade-in ${message.type === "success" ? "text-emerald-500" : "text-red-400"
                                            }`}>
                                            {message.type === "success" ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                            {message.text}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Middle Section - Links Grid */}
                <div className="grid gap-12 lg:gap-8 lg:grid-cols-12 pb-12 border-b border-white/10">
                    {/* Brand Section */}
                    <div className="lg:col-span-4">
                        <div className="group inline-flex items-center gap-3 mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-xl bg-emerald-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative w-12 h-12 flex items-center justify-center bg-gray-900 border border-emerald-500/30 rounded-xl text-white font-bold text-xl shadow-lg group-hover:border-emerald-500 transition-colors">
                                    <span className="text-emerald-500">Z</span>
                                </div>
                            </div>
                            <div className="leading-tight">
                                <p className="text-lg font-bold text-white">
                                    Zygotrix
                                </p>
                                <p className="text-xs font-medium text-emerald-500">
                                    Genetics Intelligence Engine
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
                            Uniting Mendelian ratios, polygenic scores, and expressive trait
                            registries in a toolkit designed for the future of genetic research.
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    aria-label={social.name}
                                    className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 transition-all duration-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-white hover:scale-110"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div className="lg:col-span-8 grid gap-8 sm:grid-cols-3">
                        {footerLinks.map((section) => (
                            <div key={section.heading}>
                                <h4 className="text-xs font-semibold text-slate-500 mb-5">
                                    {section.heading}
                                </h4>
                                <ul className="space-y-3">
                                    {section.links.map((link: any) => (
                                        <li key={link.label}>
                                            {link.href ? (
                                                <a
                                                    href={link.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group inline-flex items-center gap-2 text-sm text-slate-400 transition-all duration-200 hover:text-white"
                                                >
                                                    <span className="w-0 h-px bg-emerald-500 transition-all duration-300 group-hover:w-3" />
                                                    {link.label}
                                                </a>
                                            ) : (
                                                <Link
                                                    href={link.to}
                                                    className="group inline-flex items-center gap-2 text-sm text-slate-400 transition-all duration-200 hover:text-white"
                                                >
                                                    <span className="w-0 h-px bg-emerald-500 transition-all duration-300 group-hover:w-3" />
                                                    {link.label}
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section - Copyright */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">
                        © {new Date().getFullYear()} Zygotrix. All rights reserved.
                    </p>

                    <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
