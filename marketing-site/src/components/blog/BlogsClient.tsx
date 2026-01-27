"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import BlogCard from "../../components/blog/BlogCard";
import { fetchBlogs } from "../../services/hygraphApi";
import type { BlogListEntry, CategorySummary, TagSummary } from "../../types/blog";

const BlogsClient: React.FC = () => {
    const [blogs, setBlogs] = useState<BlogListEntry[]>([]);
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [tags, setTags] = useState<TagSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeAuthor, setActiveAuthor] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setIsLoading(true);
        setError(null);

        fetchBlogs(controller.signal)
            .then((result) => {
                setBlogs(result.blogs);
                setCategories(result.categories);
                setTags(result.tags);
            })
            .catch((err: unknown) => {
                if (err instanceof DOMException && err.name === "AbortError") return;
                setError(err instanceof Error ? err.message : "Failed to load blogs");
            })
            .finally(() => {
                setIsLoading(false);
            });

        return () => controller.abort();
    }, []);

    const authors = useMemo(() => {
        const map = new Map<string, { name: string }>();
        blogs.forEach((blog) => {
            blog.authors.forEach((author) => {
                if (!map.has(author.name)) {
                    map.set(author.name, { name: author.name });
                }
            });
        });
        return Array.from(map.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }, [blogs]);

    useEffect(() => {
        if (activeAuthor && !authors.some((author) => author.name === activeAuthor)) {
            setActiveAuthor(null);
        }
    }, [activeAuthor, authors]);

    const filteredBlogs = useMemo(() => {
        if (!activeAuthor) {
            return blogs;
        }
        return blogs.filter((blog) =>
            blog.authors.some((author) => author.name === activeAuthor)
        );
    }, [activeAuthor, blogs]);

    const hasContent = filteredBlogs.length > 0;
    const hasAnyBlogs = blogs.length > 0;

    return (
        <div className="relative bg-white dark:bg-gray-950 pb-24 pt-16 transition-colors duration-300">
            {/* Simple Emerald Glow Background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
                <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute top-40 right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
                <header className="space-y-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 mb-2 border border-emerald-100 dark:border-emerald-800">
                        <svg
                            className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                        </svg>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400">
                            Insights & Research
                        </p>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                        Genetic Engineering Chronicles
                    </h1>
                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400">
                        Deep dives into genomics, biotechnology, and the future of precision
                        medicine. Discover breakthrough research, cutting-edge analysis, and
                        expert insights from our genetic engineering research team.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {categories.slice(0, 6).map((category) => (
                            <span
                                key={category.slug}
                                className="rounded-full border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 font-semibold text-emerald-700 dark:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-sm transition-all cursor-pointer"
                            >
                                {category.title}
                            </span>
                        ))}
                        {categories.length > 6 && (
                            <span className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 font-medium text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all">
                                +{categories.length - 6} more
                            </span>
                        )}
                    </div>
                    {authors.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {authors.map((author) => {
                                const isActive = activeAuthor === author.name;
                                return (
                                    <button
                                        key={author.name}
                                        type="button"
                                        onClick={() =>
                                            setActiveAuthor((prev) =>
                                                prev === author.name ? null : author.name
                                            )
                                        }
                                        aria-pressed={isActive}
                                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold transition-all ${isActive
                                            ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                                            }`}
                                    >
                                        <span>{author.name}</span>
                                        {isActive && (
                                            <svg
                                                className="h-3 w-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </header>

                {isLoading && (
                    <div className="space-y-6">
                        {/* Loading header */}
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 text-emerald-600 mb-4">
                                <svg
                                    className="w-5 h-5 animate-spin"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span className="text-sm font-medium">
                                    Loading latest research articles...
                                </span>
                            </div>
                        </div>

                        {/* Enhanced loading skeleton */}
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
                                >
                                    {/* Image skeleton */}
                                    <div className="aspect-[3/2] w-full bg-gray-100 dark:bg-gray-800 animate-pulse">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    </div>

                                    {/* Content skeleton */}
                                    <div className="p-6 space-y-4">
                                        {/* Date and share button skeleton */}
                                        <div className="flex items-center justify-between">
                                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                                        </div>

                                        {/* Title skeleton */}
                                        <div className="space-y-2">
                                            <div className="h-6 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                                            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                                        </div>

                                        {/* Description skeleton */}
                                        <div className="space-y-2">
                                            <div className="h-4 w-full bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
                                            <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
                                            <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
                                        </div>

                                        {/* Author skeleton */}
                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                                            <div className="space-y-1">
                                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                                                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="mx-auto max-w-2xl rounded-2xl border-2 border-red-200/60 bg-gradient-to-br from-red-50/50 via-white to-red-50/30 p-8 text-center shadow-xl backdrop-blur-sm">
                        <div className="relative w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <svg
                                className="w-10 h-10 text-red-500"
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
                            {/* Animated pulse ring */}
                            <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping opacity-20" />
                        </div>
                        <h2 className="font-bold text-xl text-red-800 mb-3">
                            Oops! Something went wrong
                        </h2>
                        <p className="text-red-700 mb-4 leading-relaxed">
                            We couldn't load the latest research articles right now.
                        </p>
                        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-6 border border-red-200">
                            <strong>Error:</strong> {error}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
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
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Try Again
                        </button>
                    </div>
                )}

                {!isLoading && !error && !hasAnyBlogs && (
                    <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center shadow-sm">
                        <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
                            <svg
                                className="w-12 h-12 text-gray-400"
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Research Library Coming Soon
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 max-w-md mx-auto">
                            Our genetic engineering research team is preparing groundbreaking
                            content and insights. Be the first to explore cutting-edge
                            discoveries in genomics and biotechnology.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-6 py-3 text-sm font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
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
                                        d="M15 17h5l-5 5-5-5h5v-12"
                                    />
                                </svg>
                                Get Notified
                            </Link>
                            <Link
                                href="/about"
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                            >
                                Learn More About Our Research
                            </Link>
                        </div>
                    </div>
                )}

                {!isLoading && !error && hasAnyBlogs && (
                    <div className="space-y-6">
                        {/* Results counter */}
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>
                                    <strong>{filteredBlogs.length}</strong> research article
                                    {filteredBlogs.length !== 1 ? "s" : ""}{" "}
                                    {activeAuthor ? `by ${activeAuthor}` : ""} found
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                {activeAuthor && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveAuthor(null)}
                                        className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 px-3 py-1 font-medium text-gray-600 dark:text-gray-300 transition hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300"
                                    >
                                        <svg
                                            className="h-3 w-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                        Clear filter
                                    </button>
                                )}
                                <span>Updated recently · Fresh insights</span>
                            </div>
                        </div>

                        {/* Enhanced blog grid with staggered animation */}
                        {hasContent ? (
                            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredBlogs.map((blog, index) => (
                                    <div
                                        key={blog.slug}
                                        className="animate-fade-in-up"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <BlogCard blog={blog} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center text-sm text-gray-600 dark:text-gray-300 shadow-sm">
                                <p>
                                    We couldn&apos;t find any articles for{" "}
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {activeAuthor}
                                    </span>{" "}
                                    just yet. Try another author or{" "}
                                    <button
                                        type="button"
                                        onClick={() => setActiveAuthor(null)}
                                        className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline"
                                    >
                                        clear the filter
                                    </button>
                                    .
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && !error && tags.length > 0 && (
                    <footer className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <svg
                                className="w-5 h-5 text-emerald-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                                Research Topics
                            </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <span
                                    key={tag.slug}
                                    className="rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer"
                                >
                                    #{tag.title}
                                </span>
                            ))}
                        </div>
                    </footer>
                )}

                {!isLoading && !error && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Looking for something specific? Explore all research on our{" "}
                        <Link
                            href="/contact"
                            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors underline"
                        >
                            contact page
                        </Link>{" "}
                        and let us know what genetic engineering topics you'd like us to
                        cover next.
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogsClient;
