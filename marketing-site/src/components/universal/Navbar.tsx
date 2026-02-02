"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiSun, FiMoon, FiChevronDown, FiCpu, FiLayout } from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { LOGO_URL, STUDIO_URL } from "../../config";

import { PiDna } from "react-icons/pi";
import { TbGrid4X4, TbBinaryTree } from "react-icons/tb";
import { FaDna } from "react-icons/fa";

import { HiChartBar } from "react-icons/hi";
import { MdOutlineAutoAwesome } from "react-icons/md";
import { LuLayoutDashboard } from "react-icons/lu";

const baseNavItems = [
    { label: "Teams", to: "/about" },
    { label: "Resources", to: "/blogs" },
    { label: "Pricing", to: "/pricing" },
];

const appsDropdownItems = [
    { label: "Zygotrix AI", to: "/ai", icon: MdOutlineAutoAwesome },
    { label: "Zygotrix Studio", to: "/studio", icon: LuLayoutDashboard },
];

const toolsDropdownItems = [
    { label: "DNA Generator", to: "/tools/dna-generator", icon: PiDna },
    { label: "Punnett Square", to: "/tools/punnett-square", icon: TbGrid4X4 },
    { label: "DNA to Protein", to: "/tools/dna-to-protein", icon: FaDna },
    { label: "GWAS Analysis", to: "/tools/gwas-analysis", icon: HiChartBar },
    { label: "Pedigree Analyst", to: "/tools/pedigree-analyst", icon: TbBinaryTree },
];

const Navbar: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
    const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
    const [mobileAppsOpen, setMobileAppsOpen] = useState(false);
    const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
    const [mobileGetStartedOpen, setMobileGetStartedOpen] = useState(false);
    const appsDropdownRef = useRef<HTMLDivElement>(null);
    const toolsDropdownRef = useRef<HTMLDivElement>(null);

    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { theme, setTheme, resolvedTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    useEffect(() => {
        setMobileOpen(false);
        setAppsDropdownOpen(false);
        setToolsDropdownOpen(false);
        setMobileAppsOpen(false);
        setMobileToolsOpen(false);
        setMobileGetStartedOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
                setToolsDropdownOpen(false);
            }
            if (appsDropdownRef.current && !appsDropdownRef.current.contains(event.target as Node)) {
                setAppsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navItems = useMemo(() => {
        return baseNavItems;
    }, []);

    const getLinkClasses = (path: string) => {
        const isActive = pathname === path;
        return `text-sm font-normal transition-colors ${isActive
            ? "text-gray-900 dark:text-white"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`;
    };

    const isToolsActive = toolsDropdownItems.some(item => pathname === item.to);
    const isAppsActive = appsDropdownItems.some(item => pathname === item.to);

    const handleSignOut = () => {
        signOut();
    };

    return (
        <header className="sticky top-0 z-50 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <img src={LOGO_URL} alt="Zygotrix" className="w-6 h-6 object-contain" />
                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                            Zygotrix
                        </span>
                    </Link>

                    {/* Desktop Navigation - Centered */}
                    <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
                        {/* Apps Dropdown */}
                        <div
                            className="relative"
                            ref={appsDropdownRef}
                            onMouseEnter={() => setAppsDropdownOpen(true)}
                            onMouseLeave={() => setAppsDropdownOpen(false)}
                        >
                            <button
                                onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
                                className={`flex items-center gap-1 text-sm font-normal transition-colors ${isAppsActive
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    }`}
                            >
                                <span>Apps</span>
                                <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${appsDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {appsDropdownOpen && (
                                <div className="absolute top-full left-0 pt-2 w-52 z-[100]">
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                                        {appsDropdownItems.map((item) => (
                                            <Link
                                                key={item.to}
                                                href={item.to}
                                                className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${pathname === item.to
                                                    ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                    }`}
                                            >
                                                <item.icon className="w-4 h-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {navItems.map((item) => (
                            <Link key={item.to} href={item.to} className={getLinkClasses(item.to)}>
                                {item.label}
                            </Link>
                        ))}

                        {/* Tools Dropdown */}
                        <div
                            className="relative"
                            ref={toolsDropdownRef}
                            onMouseEnter={() => setToolsDropdownOpen(true)}
                            onMouseLeave={() => setToolsDropdownOpen(false)}
                        >
                            <button
                                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                                className={`flex items-center gap-1 text-sm font-normal transition-colors ${isToolsActive
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    }`}
                            >
                                <span>Tools</span>
                                <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {toolsDropdownOpen && (
                                <div className="absolute top-full left-0 pt-2 w-52 z-[100]">
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                                        {toolsDropdownItems.map((item) => (
                                            <Link
                                                key={item.to}
                                                href={item.to}
                                                className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${pathname === item.to
                                                    ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                    }`}
                                            >
                                                <item.icon className="w-4 h-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            aria-label="Toggle theme"
                        >
                            {resolvedTheme === "dark" ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
                        </button>

                        {user ? (
                            <>
                                <a
                                    href={STUDIO_URL}
                                    className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:ring-2 hover:ring-emerald-500/50 shadow-sm hover:shadow-emerald-500/20"
                                >
                                    Open Studio
                                </a>
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    className="text-sm font-normal text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                    Sign out
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Get Started Dropdown */}
                                <div className="relative group">
                                    <button className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm flex items-center gap-2">
                                        Get started <FiChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute top-full right-0 pt-2 w-48 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1 overflow-hidden">
                                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                                <span className="text-xs font-semibold text-gray-500 uppercase">Choose product</span>
                                            </div>
                                            <a href="https://ai.zygotrix.com/register" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                                <MdOutlineAutoAwesome className="w-4 h-4" /> Zygotrix AI
                                            </a>
                                            <a href={`${STUDIO_URL}/signup`} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                <LuLayoutDashboard className="w-4 h-4" /> Zygotrix Studio
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        className="p-2 text-gray-600 dark:text-gray-400 lg:hidden"
                        onClick={() => setMobileOpen((value) => !value)}
                        aria-label="Toggle navigation"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {mobileOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="px-6 py-4 space-y-1">
                        {/* Mobile Apps Dropdown */}
                        <div>
                            <button
                                onClick={() => setMobileAppsOpen(!mobileAppsOpen)}
                                className="w-full flex items-center justify-between py-2 text-sm text-gray-600 dark:text-gray-400"
                            >
                                <span>Apps</span>
                                <FiChevronDown className={`w-4 h-4 transition-transform ${mobileAppsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {mobileAppsOpen && (
                                <div className="ml-4 space-y-1 mt-1">
                                    {appsDropdownItems.map((item) => (
                                        <Link key={item.to} href={item.to} className="flex items-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400">
                                            <item.icon className="w-4 h-4" />
                                            <span>{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                href={item.to}
                                className={`block py-2 text-sm ${pathname === item.to ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div>
                            <button
                                onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                                className="w-full flex items-center justify-between py-2 text-sm text-gray-600 dark:text-gray-400"
                            >
                                <span>Tools</span>
                                <FiChevronDown className={`w-4 h-4 transition-transform ${mobileToolsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {mobileToolsOpen && (
                                <div className="ml-4 space-y-1 mt-1">
                                    {toolsDropdownItems.map((item) => (
                                        <Link key={item.to} href={item.to} className="flex items-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400">
                                            <item.icon className="w-4 h-4" />
                                            <span>{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mobile Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="flex w-full items-center justify-between py-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                            <span>Switch theme</span>
                            {resolvedTheme === "dark" ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
                        </button>

                        <div className="pt-4 space-y-2">
                            {user ? (
                                <>
                                    <a href={STUDIO_URL} className="block w-full px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium text-center">
                                        Open Studio
                                    </a>
                                    <button onClick={handleSignOut} className="block w-full text-sm text-gray-600 dark:text-gray-400 text-center py-2">
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Mobile Get Started Dropdown */}
                                    <div>
                                        <button
                                            onClick={() => setMobileGetStartedOpen(!mobileGetStartedOpen)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium transition-colors mt-2"
                                        >
                                            <span>Get started</span>
                                            <FiChevronDown className={`w-4 h-4 transition-transform ${mobileGetStartedOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {mobileGetStartedOpen && (
                                            <div className="mt-2 space-y-2 px-2 border-l-2 border-gray-100 dark:border-gray-800 ml-2">
                                                <a href="https://ai.zygotrix.com/register" className="flex items-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                                                    <FiCpu className="w-4 h-4" />
                                                    <span>Zygotrix AI</span>
                                                </a>
                                                <a href={`${STUDIO_URL}/signup`} className="flex items-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                                                    <FiLayout className="w-4 h-4" />
                                                    <span>Zygotrix Studio</span>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
