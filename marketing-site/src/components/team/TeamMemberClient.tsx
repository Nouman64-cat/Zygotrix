"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    FaLinkedin,
    FaGithub,
    FaTwitter,
    FaInstagram,
    FaArrowLeft,
    FaExternalLinkAlt,
} from "react-icons/fa";
import { FiCalendar, FiArrowRight } from "react-icons/fi";
import { fetchTeamMember } from "../../services/teamMember";
import { fetchBlogsByAuthor } from "../../services/hygraphApi";
import type { TeamMemberResponse } from "../../types/teamMember";
import type { BlogListEntry } from "../../types/blog";

// Add missing CSS styles for markdown directly or assume tailwind typography plugin
// Since Tailwind Typography is not explicitly confirmed, we will use standard classes map

const markdownComponents = {
    h1: ({ children }: any) => (
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mt-8 mb-4 first:mt-0">
            {children}
        </h1>
    ),
    h2: ({ children }: any) => (
        <h2 className="text-5xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }: any) => (
        <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-6 mb-3">{children}</h3>
    ),
    h4: ({ children }: any) => (
        <h4 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-6 mb-3">{children}</h4>
    ),
    h5: ({ children }: any) => (
        <h5 className="text-base font-semibold text-gray-700 dark:text-gray-300 mt-6 mb-3 uppercase tracking-wide">
            {children}
        </h5>
    ),
    h6: ({ children }: any) => (
        <h6 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-5 mb-3 uppercase tracking-[0.2em]">
            {children}
        </h6>
    ),
    p: ({ children }: any) => (
        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">{children}</p>
    ),
    ul: ({ children }: any) => (
        <ul className="list-disc list-outside ml-6 text-base text-gray-600 dark:text-gray-300 mb-6 space-y-2">{children}</ul>
    ),
    ol: ({ children }: any) => (
        <ol className="list-decimal list-outside ml-6 text-base text-gray-600 dark:text-gray-300 mb-6 space-y-2">{children}</ol>
    ),
    blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-emerald-500 pl-6 py-2 italic text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/50 rounded-r-lg mb-6">
            {children}
        </blockquote>
    ),
    code: ({ children, className }: any) => {
        // If it's an inline code block (no language class usually)
        const isInline = !className;
        if (isInline) {
            return <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm font-mono border border-gray-200 dark:border-gray-700">{children}</code>
        }
        return <code className={className}>{children}</code>;
    },
    pre: ({ children }: any) => (
        <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-6 rounded-lg overflow-x-auto mb-6 border border-gray-800">
            {children}
        </pre>
    ),
};

interface TeamMemberClientProps {
    slug: string;
}

const TeamMemberClient: React.FC<TeamMemberClientProps> = ({ slug }) => {
    const [teamMember, setTeamMember] = useState<TeamMemberResponse["data"]["teamMember"] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [authoredBlogs, setAuthoredBlogs] = useState<BlogListEntry[]>([]);
    const [blogsLoading, setBlogsLoading] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        fetchTeamMember(slug, controller.signal)
            .then((response) => {
                if (response.data?.teamMember) {
                    setTeamMember(response.data.teamMember);
                } else {
                    setError("Team member not found");
                }
            })
            .catch((err) => {
                if (err instanceof DOMException && err.name === "AbortError") return;
                setError(err instanceof Error ? err.message : "Failed to load team member");
            })
            .finally(() => {
                setLoading(false);
            });

        return () => controller.abort();
    }, [slug]);

    useEffect(() => {
        if (!teamMember?.name) return;

        const controller = new AbortController();
        setBlogsLoading(true);

        fetchBlogsByAuthor(teamMember.name, controller.signal)
            .then((blogs) => {
                setAuthoredBlogs(blogs);
            })
            .catch((err) => {
                if (err instanceof DOMException && err.name === "AbortError") return;
                console.error("Failed to load authored blogs", err);
            })
            .finally(() => {
                setBlogsLoading(false);
            });

        return () => controller.abort();
    }, [teamMember?.name]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;
        return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
            date
        );
    };

    const getSocialIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case "linkedin":
                return <FaLinkedin className="h-5 w-5" />;
            case "github":
                return <FaGithub className="h-5 w-5" />;
            case "twitter":
                return <FaTwitter className="h-5 w-5" />;
            case "instagram":
                return <FaInstagram className="h-5 w-5" />;
            default:
                return <FaExternalLinkAlt className="h-4 w-4" />;
        }
    };

    const getSocialColor = (platform: string) => {
        switch (platform.toLowerCase()) {
            case "linkedin":
                return "hover:text-[#0A66C2] hover:bg-[#0A66C2]/20";
            case "github":
                return "hover:text-white hover:bg-white/10";
            case "twitter":
                return "hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/20";
            case "instagram":
                return "hover:text-[#E4405F] hover:bg-[#E4405F]/20";
            default:
                return "hover:text-blue-400 hover:bg-blue-400/20";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950">
                <div className="mx-auto max-w-4xl px-6 py-24">
                    <div className="mb-8">
                        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="grid gap-12 lg:grid-cols-[2fr,1fr]">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="h-12 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                                <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-6 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                <div className="h-6 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                <div className="h-6 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="w-64 h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse mx-auto"></div>
                            <div className="space-y-3">
                                <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                                <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !teamMember) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950">
                <div className="mx-auto max-w-4xl px-6 py-24">
                    <Link
                        href="/about"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800 mb-8"
                    >
                        <FaArrowLeft className="h-4 w-4" />
                        Back to About
                    </Link>

                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-12 h-12 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Team Member Not Found
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            {error ||
                                "The team member you're looking for doesn't exist or may have been removed."}
                        </p>
                        <Link
                            href="/about"
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-white font-medium transition hover:bg-gray-800"
                        >
                            <FaArrowLeft className="h-4 w-4" />
                            Return to Team
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
            {/* Background decoration */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-50/40 via-teal-50/20 to-transparent dark:from-emerald-900/10 dark:via-teal-900/5 dark:to-transparent rounded-full blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-6 py-24">
                {/* Back Button */}
                <Link
                    href="/about"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800 mb-8 shadow-sm hover:shadow-md"
                >
                    <FaArrowLeft className="h-4 w-4" />
                    Back to About
                </Link>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Left Column (Scrollable) */}
                    <div className="space-y-4 overflow-y-auto pr-2 lg:pr-0">
                        {/* name */}
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent lg:text-4xl">
                            {teamMember.name}
                        </h1>
                        {/* role */}
                        <span className="inline-block rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-4 py-2 text-base font-semibold text-emerald-600 dark:text-emerald-400">
                            {teamMember.role}
                        </span>
                        {/* bio */}
                        <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-strong:text-emerald-600 dark:prose-strong:text-emerald-400 prose-links:text-emerald-600 dark:prose-links:text-emerald-400 prose-links:no-underline hover:prose-links:underline prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6 [&>p]:mb-6 [&>p:last-child]:mb-0">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                            >
                                {teamMember.bio.markdown}
                            </ReactMarkdown>
                        </div>
                    </div>
                    {/* Right Column (Sticky) */}
                    <div className="space-y-6 lg:border-l lg:pl-8 lg:border-gray-200 dark:lg:border-gray-800 lg:sticky lg:top-24">
                        {/* image */}
                        <div className="relative z-10 overflow-hidden rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xl max-w-sm mx-auto lg:mx-0">
                            <div className="aspect-square overflow-hidden rounded-xl ring-1 ring-gray-100 dark:ring-gray-800 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                                {teamMember.photo && teamMember.photo.url ? (
                                    <img
                                        src={teamMember.photo.url}
                                        alt={teamMember.name}
                                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                                    />
                                ) : (
                                    <span className="text-4xl font-bold text-gray-400 dark:text-gray-600 select-none">
                                        {teamMember.name
                                            .split(" ")
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .map((part) => part.charAt(0).toUpperCase())
                                            .join("")}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* social links */}
                        {teamMember.socialProfiles &&
                            teamMember.socialProfiles.length > 0 && (
                                <div className="mt-4 space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Connect
                                    </h3>
                                    <div className="space-y-2">
                                        {teamMember.socialProfiles.map((profile) => (
                                            <a
                                                key={`${profile.platform}-${profile.username}`}
                                                href={profile.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 text-gray-600 dark:text-gray-300 transition ${getSocialColor(
                                                    profile.platform
                                                )} hover:border-transparent hover:shadow-md group hover:bg-gray-50 dark:hover:bg-gray-800`}
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                                                    {getSocialIcon(profile.platform)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                        {profile.platform}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        @{profile.username}
                                                    </div>
                                                </div>
                                                <FaExternalLinkAlt className="h-3 w-3 text-gray-400 dark:text-gray-500 group-hover:text-current transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>

                {/* Published Research & Articles Section */}
                {authoredBlogs.length > 0 && (
                    <div className="mt-16">
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <svg
                                    className="w-8 h-8 text-emerald-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                </svg>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-600 dark:from-white dark:to-emerald-400 bg-clip-text text-transparent">
                                    Published Research & Articles
                                </h2>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Explore {authoredBlogs.length} research{" "}
                                {authoredBlogs.length === 1 ? "article" : "articles"} published
                                by {teamMember.name}
                            </p>
                        </div>

                        {/* Blog Cards with Genetic Theme */}
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {authoredBlogs.map((blog) => (
                                <Link
                                    key={blog.slug}
                                    href={`/blogs/${blog.slug}`}
                                    className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-lg transition-all hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-800 hover:-translate-y-1"
                                >
                                    {/* Molecule decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <svg
                                            className="w-full h-full text-emerald-600"
                                            viewBox="0 0 100 100"
                                            fill="currentColor"
                                        >
                                            <circle cx="50" cy="50" r="4" />
                                            <circle cx="20" cy="20" r="3" />
                                            <circle cx="80" cy="20" r="3" />
                                            <circle cx="20" cy="80" r="3" />
                                            <circle cx="80" cy="80" r="3" />
                                            <line
                                                x1="50"
                                                y1="50"
                                                x2="20"
                                                y2="20"
                                                stroke="currentColor"
                                                strokeWidth="1"
                                            />
                                            <line
                                                x1="50"
                                                y1="50"
                                                x2="80"
                                                y2="20"
                                                stroke="currentColor"
                                                strokeWidth="1"
                                            />
                                            <line
                                                x1="50"
                                                y1="50"
                                                x2="20"
                                                y2="80"
                                                stroke="currentColor"
                                                strokeWidth="1"
                                            />
                                            <line
                                                x1="50"
                                                y1="50"
                                                x2="80"
                                                y2="80"
                                                stroke="currentColor"
                                                strokeWidth="1"
                                            />
                                        </svg>
                                    </div>

                                    {blog.imageUrl && (
                                        <div className="mb-4 aspect-video overflow-hidden rounded-lg ring-1 ring-gray-100 dark:ring-gray-800 group-hover:ring-emerald-200 dark:group-hover:ring-emerald-800 transition-all">
                                            <img
                                                src={blog.imageUrl}
                                                alt={blog.title}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        </div>
                                    )}

                                    <div className="relative z-10">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            {blog.title}
                                        </h3>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                            {blog.excerpt}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="h-3 w-3" />
                                                <span>{formatDate(blog.date)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium group-hover:gap-2 transition-all">
                                                Read More
                                                <FiArrowRight className="h-3 w-3" />
                                            </div>
                                        </div>

                                        {/* Categories */}
                                        {blog.categories && blog.categories.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {blog.categories.slice(0, 2).map((category) => (
                                                    <span
                                                        key={category.slug}
                                                        className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                                                    >
                                                        {category.title}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State for Blogs */}
                {blogsLoading && (
                    <div className="mt-16">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-900 dark:from-white dark:to-emerald-400 bg-clip-text text-transparent">
                                Published Research & Articles
                            </h2>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((n) => (
                                <div
                                    key={n}
                                    className="h-80 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800/60 shadow-lg"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* No Blogs State */}
                {!blogsLoading && authoredBlogs.length === 0 && (
                    <div className="mt-16">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-600 dark:from-white dark:to-emerald-400 bg-clip-text text-transparent">
                                Published Research & Articles
                            </h2>
                        </div>
                        <div className="text-center py-12 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-gray-400 dark:text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">
                                {teamMember.name} hasn't published any articles yet. Check back
                                later for their research contributions!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamMemberClient;
