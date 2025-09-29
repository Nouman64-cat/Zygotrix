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
    <div className="bg-slate-50 pb-24 pt-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <header className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
            Insights & Research
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Explore the Zygotrix Blog
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600">
            Deep dives into genomics, biotechnology, and the future of precision
            medicine. Discover stories, analysis, and how-to guides from our
            research team.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500">
            {categories.slice(0, 6).map((category) => (
              <span
                key={category.slug}
                className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-semibold text-blue-600"
              >
                {category.title}
              </span>
            ))}
            {categories.length > 6 && (
              <span className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-500">
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
                className="h-80 animate-pulse rounded-3xl bg-white/60"
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            <p className="font-semibold">
              We couldn't load the latest articles.
            </p>
            <p className="mt-2">
              {error}. Try reloading this page or check back later.
            </p>
          </div>
        )}

        {!isLoading && !error && !hasContent && (
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No blog posts yet
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              We're preparing fresh content. Check back soon for insights from
              the Zygotrix team.
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
          <footer className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Popular tags
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  #{tag.title}
                </span>
              ))}
            </div>
          </footer>
        )}

        {!isLoading && !error && (
          <div className="text-center text-sm text-slate-500">
            Looking for something specific? Explore all stories on our{" "}
            <Link to="/contact" className="font-semibold text-blue-600">
              contact page
            </Link>{" "}
            and let us know what you'd like us to cover next.
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogsPage;
