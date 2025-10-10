import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import BlogCard from "../components/marketing_site/blog/BlogCard";
import { fetchBlogs } from "../services/hygraphApi";
import type { BlogListEntry, CategorySummary, TagSummary } from "../types/blog";

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogListEntry[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const hasContent = blogs.length > 0;

  return (
    <div className="relative bg-gradient-to-b from-white via-blue-50/20 to-slate-50 pb-24 pt-16">
      {/* DNA Double Helix Background Pattern */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="genetic-pattern"
              x="0"
              y="0"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              {/* DNA double helix structure */}
              <path
                d="M30,10 Q60,40 90,10 M30,110 Q60,80 90,110 M30,10 L30,110 M90,10 L90,110"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Base pairs */}
              <line
                x1="30"
                y1="30"
                x2="90"
                y2="30"
                stroke="currentColor"
                strokeWidth="1"
              />
              <line
                x1="30"
                y1="60"
                x2="90"
                y2="60"
                stroke="currentColor"
                strokeWidth="1"
              />
              <line
                x1="30"
                y1="90"
                x2="90"
                y2="90"
                stroke="currentColor"
                strokeWidth="1"
              />
              {/* Nucleotides */}
              <circle cx="30" cy="10" r="4" fill="currentColor" />
              <circle cx="90" cy="10" r="4" fill="currentColor" />
              <circle cx="30" cy="30" r="3" fill="currentColor" />
              <circle cx="90" cy="30" r="3" fill="currentColor" />
              <circle cx="30" cy="60" r="3" fill="currentColor" />
              <circle cx="90" cy="60" r="3" fill="currentColor" />
              <circle cx="30" cy="90" r="3" fill="currentColor" />
              <circle cx="90" cy="90" r="3" fill="currentColor" />
              <circle cx="30" cy="110" r="4" fill="currentColor" />
              <circle cx="90" cy="110" r="4" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#genetic-pattern)" />
        </svg>
      </div>

      {/* Floating molecule decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 mb-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
              Insights & Research
            </p>
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent sm:text-5xl">
            Genetic Engineering Chronicles
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600">
            Deep dives into genomics, biotechnology, and the future of precision
            medicine. Discover breakthrough research, cutting-edge analysis, and
            expert insights from our genetic engineering research team.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500">
            {categories.slice(0, 6).map((category) => (
              <span
                key={category.slug}
                className="rounded-full border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 font-semibold text-blue-700 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                {category.title}
              </span>
            ))}
            {categories.length > 6 && (
              <span className="rounded-full border-2 border-slate-200 bg-white px-4 py-2 font-medium text-slate-500 hover:border-slate-300 hover:shadow-md transition-all">
                +{categories.length - 6} more
              </span>
            )}
          </div>
        </header>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-3xl bg-white/60 shadow-lg"
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="mx-auto max-w-xl rounded-3xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white p-8 text-center shadow-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
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
            <p className="font-semibold text-lg text-red-700 mb-2">
              We couldn't load the latest articles.
            </p>
            <p className="mt-2 text-sm text-red-600">
              {error}. Try reloading this page or check back later.
            </p>
          </div>
        )}

        {!isLoading && !error && !hasContent && (
          <div className="mx-auto max-w-xl rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-10 text-center shadow-xl">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-blue-600"
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
            <h2 className="text-xl font-semibold text-slate-900">
              No research articles yet
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              We're preparing groundbreaking content. Check back soon for
              insights from the Zygotrix genetic engineering team.
            </p>
          </div>
        )}

        {!isLoading && !error && hasContent && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={blog.slug} blog={blog} />
            ))}
          </div>
        )}

        {!isLoading && !error && tags.length > 0 && (
          <footer className="rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
                Research Topics
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="rounded-full bg-gradient-to-r from-slate-100 to-blue-100 border border-blue-200 px-4 py-2 text-xs font-medium text-slate-700 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer hover:from-blue-100 hover:to-purple-100"
                >
                  #{tag.title}
                </span>
              ))}
            </div>
          </footer>
        )}

        {!isLoading && !error && (
          <div className="text-center text-sm text-slate-500">
            Looking for something specific? Explore all research on our{" "}
            <Link
              to="/contact"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors underline"
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

export default BlogsPage;
