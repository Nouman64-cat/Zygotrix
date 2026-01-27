"use client";

import React from "react";
import Link from "next/link";
import type { BlogListEntry } from "../../types/blog";

interface RelatedBlogsProps {
    currentSlug?: string;
    categories: Array<{ slug: string; title: string }>;
    blogs: BlogListEntry[];
    max?: number;
}

const RelatedBlogs: React.FC<RelatedBlogsProps> = ({
    currentSlug,
    categories,
    blogs,
    max = 3,
}) => {
    if (!blogs || blogs.length === 0 || !categories || categories.length === 0)
        return null;

    // Build a set of category slugs for quick lookup
    const categorySet = new Set(categories.map((c) => c.slug));

    const related = blogs
        .filter((b) => b.slug !== currentSlug)
        .filter((b) => (b.categories || []).some((c) => categorySet.has(c.slug)))
        .slice(0, max);

    if (related.length === 0) return null;

    return (
        <aside className="mt-12">
            <h4 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Related posts
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                    <Link
                        key={r.slug}
                        href={`/blogs/${r.slug}`}
                        className="block overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-transform duration-150 ease-out dark:border dark:border-gray-700 hover:ring-2 hover:ring-emerald-500/20"
                    >
                        <div className="h-40 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                            {r.imageUrl ? (
                                <img
                                    src={r.imageUrl}
                                    alt={r.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                                    <span className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                                        {r.title.charAt(0)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-white dark:bg-gray-800">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                                {r.title}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {new Intl.DateTimeFormat("en-US", {
                                    dateStyle: "medium",
                                }).format(new Date(r.date))}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </aside>
    );
};

export default RelatedBlogs;
