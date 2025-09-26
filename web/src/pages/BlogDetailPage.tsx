import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import { fetchBlogBySlug } from "../services/hygraphApi";
import type { BlogDetail } from "../types/blog";

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(date);
};

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Missing blog identifier.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchBlogBySlug(slug, controller.signal)
      .then((result) => {
        setBlog(result);
        if (!result) {
          setError("We couldn't find this story.");
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load article");
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [slug]);

  const showArticle = !isLoading && !error && blog;

  return (
    <div className="bg-slate-50 pb-24">
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-900/40">
        <div className="absolute inset-0 overflow-hidden">
          {blog?.imageUrl && (
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="h-full w-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-slate-900/60" />
        </div>
        <div className="relative mx-auto flex max-w-4xl flex-col gap-6 px-4 py-24 text-white sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-blue-200">
            <Link to="/blogs" className="hover:text-white">
              Blog
            </Link>
            <span className="text-white/40">/</span>
            <span>{blog?.categories[0]?.title ?? "Story"}</span>
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            {blog?.title || (isLoading ? "Loading..." : "Blog post")}
          </h1>
          {blog && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span>{formatDate(blog.date)}</span>
              {blog.authors.map((author) => (
                <span key={author.name} className="flex items-center gap-2">
                  {author.imageUrl ? (
                    <img
                      src={author.imageUrl}
                      alt={author.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                      {author.name
                        .split(" ")
                        .map((part) => part.charAt(0))
                        .join("")
                        .slice(0, 2)}
                    </span>
                  )}
                  <span>{author.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-[-6rem] w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="rounded-3xl bg-white p-8 shadow-xl">
            <div className="mb-4 h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-4 w-full animate-pulse rounded-full bg-slate-200"
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center text-red-600">
            <h2 className="text-xl font-semibold">{error}</h2>
            <p className="mt-4 text-sm text-red-500">
              Return to the{" "}
              <Link to="/blogs" className="font-semibold text-blue-600">
                blog index
              </Link>{" "}
              for other stories.
            </p>
          </div>
        )}

        {showArticle && blog && (
          <article className="rounded-3xl bg-white p-10 shadow-xl">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown>{blog.content}</ReactMarkdown>
            </div>
            {blog.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                  >
                    #{tag.title}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-10 flex justify-between text-sm text-slate-500">
              <Link to="/blogs" className="font-semibold text-blue-600">
                Back to all articles
              </Link>
              <span>Published {formatDate(blog.date)}</span>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

export default BlogDetailPage;
