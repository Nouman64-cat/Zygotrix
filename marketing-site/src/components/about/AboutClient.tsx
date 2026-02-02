"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FaLinkedin,
    FaGithub,
    FaUsers,
    FaTwitter,
    FaInstagram,
    FaExternalLinkAlt,
    FaDiscord,
} from "react-icons/fa";
import { HiBeaker, HiCog } from "react-icons/hi";

import { fetchTeamMembers } from "../../services/teamMember";
import type { TeamMemberSummary } from "../../types/teamMember";

const CONTACT_EMAIL = "contact@zygotrix.com";

const cardPalettes = [
    {
        cardClass: "bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30",
        overlayClass:
            "bg-gradient-to-br from-emerald-400/5 via-teal-400/5 to-cyan-400/5",
        glowGradient: "from-emerald-400 to-teal-400",
        titleGradient: "from-gray-900 to-emerald-900 dark:from-white dark:to-emerald-200",
        hoverTitleGradient: "group-hover:from-emerald-600 group-hover:to-teal-600 dark:group-hover:from-emerald-300 dark:group-hover:to-teal-300",
        arrowColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
        cardClass: "bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/30",
        overlayClass:
            "bg-gradient-to-br from-teal-400/5 via-emerald-400/5 to-green-400/5",
        glowGradient: "from-teal-400 to-emerald-400",
        titleGradient: "from-gray-900 to-teal-900 dark:from-white dark:to-teal-200",
        hoverTitleGradient: "group-hover:from-teal-600 group-hover:to-emerald-600 dark:group-hover:from-teal-300 dark:group-hover:to-emerald-300",
        arrowColor: "text-teal-600 dark:text-teal-400",
    },
    {
        cardClass: "bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30",
        overlayClass:
            "bg-gradient-to-br from-green-400/5 via-emerald-400/5 to-teal-400/5",
        glowGradient: "from-green-400 to-emerald-400",
        titleGradient: "from-gray-900 to-green-900 dark:from-white dark:to-green-200",
        hoverTitleGradient: "group-hover:from-green-600 group-hover:to-emerald-600 dark:group-hover:from-green-300 dark:group-hover:to-emerald-300",
        arrowColor: "text-emerald-600 dark:text-emerald-400",
    },
] as const;

const inferPlatform = (platform?: string | null, url?: string) => {
    if (platform && platform.trim()) {
        return platform.trim().toLowerCase();
    }

    if (!url) {
        return "website";
    }

    try {
        const host = new URL(url).hostname.toLowerCase();

        if (host.includes("linkedin")) return "linkedin";
        if (host.includes("github")) return "github";
        if (host.includes("twitter") || host.includes("x.com")) return "twitter";
        if (host.includes("instagram")) return "instagram";
        if (host.includes("researchgate")) return "researchgate";
        if (host.includes("academia")) return "academia";
    } catch {
        // Ignore URL parsing failures and fall back to website
    }

    return "website";
};

const getSocialIcon = (platform: string) => {
    switch (platform) {
        case "linkedin":
            return <FaLinkedin className="h-5 w-5" />;
        case "github":
            return <FaGithub className="h-5 w-5" />;
        case "twitter":
            return <FaTwitter className="h-5 w-5" />;
        case "instagram":
            return <FaInstagram className="h-5 w-5" />;
        case "academia":
            return (
                <span
                    className="h-5 w-5 flex items-center justify-center font-bold text-2xl text-gray-700"
                    style={{ fontFamily: "serif" }}
                >
                    A
                </span>
            );
        case "researchgate":
            return (
                <span
                    className="h-5 w-5 flex items-center justify-center font-bold text-gray-700"
                    style={{ fontFamily: "serif", fontSize: "1.1rem" }}
                >
                    R<sup className="text-xs align-super">G</sup>
                </span>
            );
        default:
            return <FaExternalLinkAlt className="h-4 w-4" />;
    }
};

const getSocialButtonClasses = (platform: string) => {
    switch (platform) {
        case "linkedin":
            return "text-blue-600 hover:text-blue-700";
        case "github":
            return "text-slate-700 hover:text-slate-900";
        case "twitter":
            return "text-sky-500 hover:text-sky-600";
        case "instagram":
            return "text-pink-500 hover:text-pink-600";
        case "researchgate":
            return "text-emerald-600 hover:text-emerald-700";
        case "academia":
            return "text-amber-600 hover:text-amber-700";
        default:
            return "text-indigo-600 hover:text-indigo-700";
    }
};

const getPlatformLabel = (platform: string) => {
    switch (platform) {
        case "linkedin":
            return "LinkedIn";
        case "github":
            return "GitHub";
        case "twitter":
            return "Twitter";
        case "instagram":
            return "Instagram";
        case "researchgate":
            return "ResearchGate";
        case "academia":
            return "Academia";
        default:
            return "website";
    }
};

const getInitials = (name: string) => {
    return (
        name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("") || "?"
    );
};


const values = [
    {
        name: "Scientific rigor",
        icon: HiBeaker,
        description:
            "Probability engines are validated against published ratios and unit tests, keeping outputs predictable and reproducible.",
        color: "from-blue-500 to-cyan-500",
    },
    {
        name: "Design empathy",
        icon: FaUsers,
        description:
            "Interfaces are built for cross-functional teams so engineers, geneticists, and operators work from a shared language.",
        color: "from-purple-500 to-pink-500",
    },
    {
        name: "Extensible tooling",
        icon: HiCog,
        description:
            "Traits, weights, and downstream pipelines are modular so teams can adapt Zygotrix to bespoke research programs.",
        color: "from-emerald-500 to-teal-500",
    },
];

const AboutClient: React.FC = () => {
    const router = useRouter();
    const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);
    const [teamLoading, setTeamLoading] = useState(true);
    const [teamError, setTeamError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        setTeamLoading(true);
        setTeamError(null);

        fetchTeamMembers(controller.signal)
            .then((members) => {
                if (!isMounted) return;
                setTeamMembers(members);
            })
            .catch((error) => {
                if (!isMounted) return;
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }
                setTeamError(
                    error instanceof Error ? error.message : "Failed to load team members"
                );
            })
            .finally(() => {
                if (isMounted) {
                    setTeamLoading(false);
                }
            });

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [retryKey]);

    const handleRetry = () => setRetryKey((prev) => prev + 1);

    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen transition-colors duration-300">
            {/* Background decoration - optional, subtle */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-50/40 via-teal-50/20 to-transparent dark:from-emerald-900/10 dark:via-teal-900/5 dark:to-transparent rounded-full blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-24">
                <div className="grid gap-16 lg:grid-cols-[1.2fr,1fr] lg:items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 border border-emerald-100 dark:border-emerald-800">
                            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Our Story
                            </span>
                        </div>

                        <h1 className="text-5xl font-bold leading-tight text-gray-900 dark:text-white sm:text-6xl">
                            Zygotrix is crafted for teams who translate
                            <span className="relative whitespace-nowrap px-2">
                                <span className="relative z-10 text-emerald-500">genetics</span>
                            </span>
                            into action.
                        </h1>

                        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400 max-w-2xl">
                            We believe that understanding inheritance patterns should feel
                            intuitive, whether you are prototyping in a notebook or running
                            production simulations. Zygotrix distills complex models into
                            approachable building blocks so you can focus on insight
                            generation.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <a
                                href={`mailto:${CONTACT_EMAIL}`}
                                className="group inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-white px-8 py-3 text-sm font-semibold text-white dark:text-gray-900 transition-all hover:bg-gray-800 dark:hover:bg-gray-100"
                            >
                                <span>Contact us</span>
                                <svg
                                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                </svg>
                            </a>
                            <a
                                href="#team"
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-8 py-3 text-sm font-semibold text-gray-900 dark:text-white transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Meet the team
                            </a>
                        </div>
                    </div>

                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-sm">
                            <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 shadow-xl">

                                {/* Logo or placeholder */}
                                <div className="mx-auto w-36 mb-6 flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-white">
                                    ZYGOTRIX
                                </div>

                                <p className="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                    Merging Mendelian logic, polygenic scoring, and thoughtful
                                    interaction design into a single learning platform.
                                </p>

                                <div className="mt-6 flex justify-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-100" />
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="team" className="mt-20">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 border border-emerald-100 dark:border-emerald-800 mb-6">
                            <FaUsers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Our Team
                            </span>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Meet the minds behind Zygotrix
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Core contributors and collaborators who help guide Zygotrix
                            towards making genetics accessible for everyone.
                        </p>
                    </div>

                    {teamError && (
                        <div className="mx-auto mb-10 max-w-3xl rounded-3xl border border-red-200 bg-red-50/80 p-6 text-center text-red-600 shadow-sm">
                            <p className="text-sm sm:text-base font-semibold">
                                We're having trouble loading the team roster.
                            </p>
                            <p className="mt-2 text-xs sm:text-sm text-red-500/80">
                                {teamError}
                            </p>
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="mt-4 inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Team Members */}
                    {teamLoading && (
                        <div className="max-w-6xl mx-auto">
                            {/* Skeleton for founder */}
                            <div className="h-48 rounded-3xl border-2 border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 shadow-lg animate-pulse mb-8" />
                            {/* Skeleton for other members */}
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {[0, 1, 2].map((index) => (
                                    <div
                                        key={`team-skeleton-${index}`}
                                        className="h-56 rounded-2xl border-2 border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 shadow-lg animate-pulse"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {!teamLoading && teamMembers.length > 0 && (() => {
                        const founder = teamMembers.find((m) => Boolean(m.founder));
                        const otherMembers = teamMembers.filter((m) => !Boolean(m.founder));
                        // Separate active and non-active contributors
                        const activeMembers = otherMembers.filter((m) => m.active === true);
                        const inactiveMembers = otherMembers.filter((m) => m.active !== true);


                        return (
                            <div className="max-w-6xl mx-auto">
                                {/* Featured Founder Card */}
                                {founder && (
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => router.push(`/team/${founder.slug}`)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                router.push(`/team/${founder.slug}`);
                                            }
                                        }}
                                        className="cursor-pointer group relative block overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 md:p-10 shadow-lg hover:shadow-xl transition-all mb-10 text-left"
                                    >
                                        {/* Glow effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-teal-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {/* Decorative elements */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/20 to-teal-100/20 rounded-full blur-3xl" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-teal-100/20 to-emerald-100/20 rounded-full blur-2xl" />

                                        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
                                            {/* Large Photo */}
                                            <div className="relative flex-shrink-0">
                                                <div className="absolute inset-0 rounded-full bg-emerald-100 blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                                                {founder.photo?.url ? (
                                                    <img
                                                        src={founder.photo.url}
                                                        alt={`${founder.name} portrait`}
                                                        className="relative h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-xl group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="relative flex h-32 w-32 md:h-40 md:w-40 items-center justify-center rounded-full border-4 border-white dark:border-gray-800 bg-gray-100 text-4xl md:text-5xl font-bold text-gray-500 shadow-xl group-hover:scale-105 transition-transform duration-300">
                                                        {getInitials(founder.name)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 text-center md:text-left">
                                                {/* Founder Badge */}
                                                <div className="inline-flex items-center gap-2 mb-3">
                                                    <span className="rounded-full px-5 py-2 text-sm font-bold bg-emerald-500 text-white shadow-md">
                                                        Founder & CEO
                                                    </span>
                                                </div>

                                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                                    {founder.name}
                                                </h3>
                                                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-3">
                                                    {founder.role}
                                                </p>

                                                {/* Founder Bio */}
                                                {founder.introduction && founder.introduction.trim().length > 0 && (
                                                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-4 max-w-2xl">
                                                        {founder.introduction}
                                                    </p>
                                                )}

                                                {/* Social Links */}
                                                {(founder.socialProfiles ?? []).filter((p) => p && p.url).length > 0 && (
                                                    <div className="flex justify-center md:justify-start gap-3">
                                                        {(founder.socialProfiles ?? []).filter((p) => p && p.url).map((profile) => {
                                                            const platform = inferPlatform(profile.platform, profile.url);
                                                            return (
                                                                <a
                                                                    key={profile.url}
                                                                    href={profile.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`rounded-full bg-white dark:bg-slate-700 p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 ${getSocialButtonClasses(platform)}`}
                                                                    aria-label={`${founder.name}'s ${getPlatformLabel(platform)} profile`}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                >
                                                                    {getSocialIcon(platform)}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Arrow indicator */}
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="rounded-full bg-emerald-500 p-2 shadow-md">
                                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Active Team Members Grid */}
                                {activeMembers.length > 0 && (
                                    <>
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                Active Contributors
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Currently contributing to the Zygotrix project
                                            </p>
                                        </div>
                                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
                                            {activeMembers.map((member, index) => {
                                                const palette = cardPalettes[(index + 1) % cardPalettes.length];
                                                const socialProfiles = (member.socialProfiles ?? []).filter(
                                                    (profile) => profile && profile.url
                                                );

                                                return (
                                                    <Link
                                                        key={member.slug}
                                                        href={`/team/${member.slug}`}
                                                        className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-md transition-all hover:shadow-xl hover:scale-[1.02]"
                                                    >
                                                        <div
                                                            className={`absolute inset-0 ${palette.overlayClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                                                        />

                                                        <div className="relative flex items-center gap-4">
                                                            {/* Photo */}
                                                            <div className="relative flex-shrink-0">
                                                                <div
                                                                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${palette.glowGradient} blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
                                                                />
                                                                {member.photo?.url ? (
                                                                    <img
                                                                        src={member.photo.url}
                                                                        alt={`${member.name} portrait`}
                                                                        className="relative h-16 w-16 rounded-full border-3 border-white object-cover shadow-md group-hover:scale-110 transition-transform duration-300"
                                                                    />
                                                                ) : (
                                                                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xl font-bold text-gray-600 shadow-md group-hover:scale-110 transition-transform duration-300">
                                                                        {getInitials(member.name)}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <h3
                                                                    className={`text-lg font-bold bg-gradient-to-r ${palette.titleGradient} bg-clip-text text-transparent transition-all duration-300 ${palette.hoverTitleGradient} truncate`}
                                                                >
                                                                    {member.name}
                                                                </h3>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                                    {member.role}
                                                                </p>
                                                                <span className="inline-block mt-2 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                                                                    Contributor
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Social Links */}
                                                        {socialProfiles.length > 0 && (
                                                            <div className="relative mt-4 flex gap-2">
                                                                {socialProfiles.slice(0, 4).map((profile) => {
                                                                    const platform = inferPlatform(profile.platform, profile.url);
                                                                    return (
                                                                        <a
                                                                            key={profile.url}
                                                                            href={profile.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className={`rounded-full bg-white dark:bg-slate-700 p-2 shadow-sm hover:shadow-md transition-all hover:scale-110 ${getSocialButtonClasses(platform)}`}
                                                                            aria-label={`${member.name}'s ${getPlatformLabel(platform)} profile`}
                                                                            onClick={(event) => event.stopPropagation()}
                                                                        >
                                                                            {React.cloneElement(getSocialIcon(platform), { className: "h-4 w-4" })}
                                                                        </a>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Arrow */}
                                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="rounded-full bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm p-1.5 shadow-md">
                                                                <svg className={`h-3 w-3 ${palette.arrowColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {/* Past Contributors / Alumni Section */}
                                {inactiveMembers.length > 0 && (
                                    <>
                                        <div className="mb-6 mt-8">
                                            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                                                Past Contributors
                                            </h3>
                                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                                Alumni who helped shape Zygotrix
                                            </p>
                                        </div>
                                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                            {inactiveMembers.map((member) => {
                                                const socialProfiles = (member.socialProfiles ?? []).filter(
                                                    (profile) => profile && profile.url
                                                );

                                                return (
                                                    <Link
                                                        key={member.slug}
                                                        href={`/team/${member.slug}`}
                                                        className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-6 shadow-sm shadow-gray-200/30 dark:shadow-gray-900/10 transition-all hover:shadow-lg hover:scale-[1.01] opacity-70 hover:opacity-100"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100/30 via-gray-200/30 to-gray-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                        <div className="relative flex items-center gap-4">
                                                            {/* Photo - slightly desaturated */}
                                                            <div className="relative flex-shrink-0">
                                                                {member.photo?.url ? (
                                                                    <img
                                                                        src={member.photo.url}
                                                                        alt={`${member.name} portrait`}
                                                                        className="relative h-14 w-14 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover shadow-sm grayscale-[30%] group-hover:grayscale-0 transition-all duration-300"
                                                                    />
                                                                ) : (
                                                                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-lg font-bold text-gray-500 dark:text-gray-400 shadow-sm">
                                                                        {getInitials(member.name)}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                                                    {member.name}
                                                                </h3>
                                                                <p className="text-sm text-gray-400 dark:text-gray-500 truncate">
                                                                    {member.role}
                                                                </p>
                                                                <span className="inline-block mt-2 rounded-full px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                                                    Past Contributor
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Social Links */}
                                                        {socialProfiles.length > 0 && (
                                                            <div className="relative mt-4 flex gap-2">
                                                                {socialProfiles.slice(0, 4).map((profile) => {
                                                                    const platform = inferPlatform(profile.platform, profile.url);
                                                                    return (
                                                                        <a
                                                                            key={profile.url}
                                                                            href={profile.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="rounded-full bg-gray-100 dark:bg-gray-700 p-2 shadow-sm hover:shadow-md transition-all hover:scale-110 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                                            aria-label={`${member.name}'s ${getPlatformLabel(platform)} profile`}
                                                                            onClick={(event) => event.stopPropagation()}
                                                                        >
                                                                            {React.cloneElement(getSocialIcon(platform), { className: "h-4 w-4" })}
                                                                        </a>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Arrow */}
                                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="rounded-full bg-gray-200/90 dark:bg-gray-600/90 backdrop-blur-sm p-1.5 shadow-sm">
                                                                <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                    {!teamLoading && teamMembers.length === 0 && !teamError && (
                        <div className="mt-10 mx-auto max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 p-8 text-center shadow-md">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                Team roster coming soon
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Our Hygraph workspace does not have any published team members
                                yet. Check back soon to learn more about the people building
                                Zygotrix.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-20">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 border border-emerald-100 dark:border-emerald-800 mb-6">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Our Values
                            </span>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            What guides us
                        </h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
                        {values.map((value, index) => {
                            const Icon = value.icon;
                            return (
                                <div
                                    key={value.name}
                                    className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                                    style={{ animationDelay: `${index * 200}ms` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-blue-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative">
                                        <div
                                            className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gray-900 dark:bg-gray-800 text-white mb-6 shadow-md group-hover:scale-110 transition-transform duration-300"
                                        >
                                            <Icon className="w-8 h-8" />
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                                            {value.name}
                                        </h3>

                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {value.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Community Section */}
                <div className="mt-20">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 border border-emerald-100 dark:border-emerald-800 mb-6">
                            <FaUsers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Our Community
                            </span>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Join the Zygotrix Community
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Connect with genetics enthusiasts, researchers, and developers. Share ideas, get support, and be part of our growing community.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                        {/* Discord Card */}
                        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-gray-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative flex items-start gap-4">
                                <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gray-900 dark:bg-gray-800 text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                                    <FaDiscord className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Discord Server
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                        Join our Discord for real-time discussions, community events, and direct support from the team.
                                    </p>
                                    <a
                                        href="https://discord.gg/5qtEfusv"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-gray-900 dark:text-white font-semibold hover:gap-3 transition-all"
                                    >
                                        Join Server <span aria-hidden="true">&rarr;</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* GitHub Card */}
                        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-gray-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative flex items-start gap-4">
                                <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                                    <FaGithub className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        GitHub
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                        Explore our open-source contributions, report issues, and contribute to the codebase.
                                    </p>
                                    <a
                                        href="https://github.com/Nouman64-cat/Zygotrix"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-400 font-semibold hover:gap-3 transition-all"
                                    >
                                        View Repository <span aria-hidden="true">&rarr;</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutClient;
