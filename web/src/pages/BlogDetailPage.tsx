import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import { fetchBlogBySlug, fetchBlogs } from "../services/hygraphApi";
import type { BlogDetail, BlogListEntry } from "../types/blog";
import RelatedBlogs from "../components/marketing_site/blog/RelatedBlogs";
import { FiCalendar, FiClock, FiShare2, FiArrowLeft } from "react-icons/fi";

// Runtime check for a globally-provided DOMPurify (optional).
const getDOMPurifySanitizer = (): ((html: string) => string) | null => {
  if (typeof window === "undefined") return null;
  const win = window as any;
  return typeof win?.DOMPurify?.sanitize === "function"
    ? win.DOMPurify.sanitize.bind(win.DOMPurify)
    : null;
};
const DOMPurifySanitize = getDOMPurifySanitizer();

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
  const [copied, setCopied] = useState(false);
  const [allBlogs, setAllBlogs] = useState<BlogListEntry[]>([]);

  const estimateReadingTime = (content: string | undefined | null) => {
    if (!content) return 1;
    // Strip HTML tags if present
    const text = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return 1;
    const words = text.split(" ").filter(Boolean).length;
    const wpm = 200; // average reading speed
    return Math.max(1, Math.round(words / wpm));
  };

  const handleShare = async () => {
    if (!blog) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt ?? undefined,
          url,
        });
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Fallback: prompt with the URL
      // eslint-disable-next-line no-alert
      window.prompt("Copy this link:", url);
    } catch (err) {
      // ignore share failures
      console.error("Share failed:", err);
    }
  };

  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold text-slate-900 mt-8 mb-4 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">{children}</h3>
    ),
    p: ({ children }: any) => (
      <p className="text-slate-700 leading-relaxed mb-6">{children}</p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside text-slate-700 mb-6 space-y-2">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside text-slate-700 mb-6 space-y-2">
        {children}
      </ol>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-600 pl-6 py-2 italic text-slate-700 bg-slate-50 rounded-r-lg mb-6">
        {children}
      </blockquote>
    ),
    code: ({ children }: any) => (
      <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }: any) => (
      <pre className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto mb-6">
        {children}
      </pre>
    ),
  };

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

  // Fetch list of all blogs to power related-posts
  useEffect(() => {
    const controller = new AbortController();
    fetchBlogs(controller.signal)
      .then((data) => {
        setAllBlogs(data.blogs || []);
      })
      .catch((err) => {
        // non-fatal
        console.error("Failed to load blog list for related posts", err);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="bg-slate-50 pb-24">
      {/* Hero Image */}
      <div>
        {blog?.imageUrl && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 mt-10">
            <div className="aspect-video rounded-2xl overflow-hidden">
              <img
                src={blog?.imageUrl}
                alt={blog?.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto mt-8 w-full max-w-4xl relative z-20">
        {isLoading && (
          <div className="rounded-3xl bg-white p-8 shadow-xl">
            <div className="mb-4 h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={`skeleton-${n}`}
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
        {/* Blog Content */}
        <article className=" px-4 sm:px-6 lg:px-8 pb-20">
          {/* Meta Info + Share */}
          <div className="flex items-center justify-between text-sm text-slate-500 border-slate-200 pb-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <FiCalendar className="mr-2 h-4 w-4" />
                <span>{blog ? formatDate(blog.date) : ""}</span>
              </div>
              <div className="flex items-center">
                <FiClock className="mr-2 h-4 w-4" />
                <span>
                  {blog ? `${estimateReadingTime(blog.content)} min read` : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                <FiShare2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              {copied && (
                <span className="text-sm text-green-600">Link copied</span>
              )}
            </div>
          </div>
          {/* Title */}
          <header className="mb-8">
            <div className="mb-4">
              <Link
                to="/blogs"
                className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" /> Back to all articles
              </Link>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              {blog?.title}
            </h1>
          </header>

          {/* Blog Content */}
          <div className="prose prose-lg prose-slate max-w-none">
            {typeof blog?.content === "string" && /^\s*</.test(blog.content) ? (
              <div
                className="blog-html-content"
                dangerouslySetInnerHTML={{
                  __html: DOMPurifySanitize
                    ? DOMPurifySanitize(blog.content)
                    : blog.content ?? "",
                }}
              />
            ) : (
              <ReactMarkdown components={markdownComponents}>
                {blog?.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Tags */}
          {blog?.tags && blog.tags.length > 0 && (
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
            <span>Published {blog ? formatDate(blog.date) : ""}</span>
          </div>
        </article>

        {/* Related posts */}
        {blog && (
          <div className="mx-auto mt-8 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <RelatedBlogs
              currentSlug={blog.slug}
              categories={blog.categories ?? []}
              blogs={allBlogs}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDetailPage;
