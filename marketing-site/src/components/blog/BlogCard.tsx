"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiShare2 } from "react-icons/fi";

import type { BlogListEntry } from "../../types/blog";

interface BlogCardProps {
    blog: BlogListEntry;
}

const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
    }).format(date);
};

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
    const [copied, setCopied] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const url = `${window.location.origin}/blogs/${blog.slug}`;
            if ((navigator as any).share) {
                await (navigator as any).share({
                    title: blog.title,
                    text: blog.excerpt ?? undefined,
                    url,
                });
                return;
            }

            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
                return;
            }

            // Fallback
            // eslint-disable-next-line no-alert
            window.prompt("Copy this link:", url);
        } catch (err) {
            // ignore
            // eslint-disable-next-line no-console
            console.error("Share failed", err);
        }
    };
    return (
        <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-400/80 hover:shadow-xl hover:shadow-blue-500/10">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-purple-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

            <Link
                href={`/blogs/${blog.slug}`}
                aria-label={`Read ${blog.title}`}
                className="relative"
            >
                <div className="aspect-[3/2] w-full overflow-hidden bg-slate-100 dark:bg-slate-700 relative">
                    {blog.imageUrl ? (
                        <>
                            <img
                                src={blog.imageUrl}
                                alt={blog.title}
                                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                                loading="lazy"
                            />
                            {/* Image overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 text-blue-600 relative">
                            {/* Animated background pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <svg
                                    className="h-full w-full"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <defs>
                                        <pattern
                                            id="blog-pattern"
                                            x="0"
                                            y="0"
                                            width="40"
                                            height="40"
                                            patternUnits="userSpaceOnUse"
                                        >
                                            <circle cx="20" cy="20" r="2" fill="currentColor" />
                                            <circle cx="10" cy="10" r="1" fill="currentColor" />
                                            <circle cx="30" cy="30" r="1" fill="currentColor" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#blog-pattern)" />
                                </svg>
                            </div>
                            <div className="relative z-10 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/80 shadow-lg mb-2">
                                    <span className="text-2xl font-bold text-blue-600">
                                        {blog.title.charAt(0)}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-blue-600/80">Article</p>
                            </div>
                        </div>
                    )}

                    {/* Reading time indicator */}
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 opacity-80 transition-opacity group-hover:opacity-100">
                        <svg
                            className="inline w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {Math.max(1, Math.ceil((blog.excerpt?.length || 0) / 200))} min read
                    </div>
                </div>
            </Link>
            <div className="relative flex flex-1 flex-col gap-4 p-6">
                {/* Enhanced header with date and share */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>{formatDate(blog.date)}</span>
                    </div>
                    <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all hover:border-blue-400 hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-300 hover:shadow-sm"
                        aria-label={`Share ${blog.title}`}
                    >
                        <FiShare2 className="h-3 w-3" />
                        <span className="hidden sm:inline">
                            {copied ? "Copied!" : "Share"}
                        </span>
                    </button>
                </div>

                {/* Enhanced content area */}
                <div className="space-y-3 flex-1">
                    <h3 className="text-xl font-bold leading-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-200">
                        <Link href={`/blogs/${blog.slug}`} className="line-clamp-2">
                            {blog.title}
                        </Link>
                    </h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                        {blog.excerpt}
                    </p>

                    {/* Category/Tags badges */}
                    {blog.categories && blog.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {blog.categories.slice(0, 2).map((category) => (
                                <span
                                    key={category.slug}
                                    className="inline-flex items-center rounded-md bg-blue-500/10 dark:bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-400/50"
                                >
                                    {category.title}
                                </span>
                            ))}
                            {blog.categories.length > 2 && (
                                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                                    +{blog.categories.length - 2}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {/* Enhanced author section */}
                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {blog.authors.slice(0, 2).map((author) => (
                                <div key={author.name} className="flex items-center gap-2">
                                    {author.imageUrl ? (
                                        <img
                                            src={author.imageUrl}
                                            alt={author.name}
                                            className="h-9 w-9 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shadow-sm"
                                        />
                                    ) : (
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-xs font-bold text-blue-700 ring-2 ring-white shadow-sm">
                                            {author.name
                                                .split(" ")
                                                .map((part) => part.charAt(0))
                                                .join("")
                                                .slice(0, 2)}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                            {author.name}
                                        </p>
                                        {author.role && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {author.role}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {blog.authors.length > 2 && (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-700">
                                    +{blog.authors.length - 2}
                                </div>
                            )}
                        </div>

                        {/* Read more arrow */}
                        <Link
                            href={`/blogs/${blog.slug}`}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 hover:scale-110"
                            aria-label={`Read ${blog.title}`}
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default BlogCard;
