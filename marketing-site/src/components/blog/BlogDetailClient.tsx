"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { fetchBlogBySlug, fetchBlogs } from "../../services/hygraphApi";
import type { BlogDetail, BlogListEntry } from "../../types/blog";
import RelatedBlogs from "./RelatedBlogs";
import { FiCalendar, FiClock, FiShare2, FiArrowLeft } from "react-icons/fi";

const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
    }).format(date);
};

const markdownComponents = {
    h1: ({ children }: any) => (
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mt-8 mb-4 first:mt-0">
            {children}
        </h1>
    ),
    h2: ({ children }: any) => (
        <h2 className="text-5xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            {children}
        </h2>
    ),
    h3: ({ children }: any) => (
        <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-6 mb-3">
            {children}
        </h3>
    ),
    h4: ({ children }: any) => (
        <h4 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-6 mb-3">
            {children}
        </h4>
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
        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">
            {children}
        </p>
    ),
    ul: ({ children }: any) => (
        <ul className="list-disc list-outside ml-6 text-base text-gray-600 dark:text-gray-300 mb-6 space-y-2">{children}</ul>
    ),
    ol: ({ children }: any) => (
        <ol className="list-decimal list-outside ml-6 text-base text-gray-600 dark:text-gray-300 mb-6 space-y-2">{children}</ol>
    ),
    blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-emerald-500 pl-6 py-2 italic text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg mb-6">
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
        <pre className="bg-gray-900 dark:bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto mb-6">
            {children}
        </pre>
    ),
};

interface BlogDetailClientProps {
    slug: string;
}

const BlogDetailClient: React.FC<BlogDetailClientProps> = ({ slug }) => {
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
        <div className="relative bg-white dark:bg-gray-950 pb-24 transition-colors duration-300">
            {/* Background decoration */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-50/40 via-teal-50/20 to-transparent dark:from-emerald-900/10 dark:via-teal-900/5 dark:to-transparent rounded-full blur-3xl opacity-50" />
            </div>

            {/* Hero Image */}
            <div>
                {blog?.imageUrl && (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 mt-10">
                        <div className="aspect-video rounded-2xl overflow-hidden ring-4 ring-emerald-500/10 shadow-2xl shadow-emerald-500/20">
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
                    <div className="rounded-3xl bg-white dark:bg-gray-800/60 p-8 shadow-xl">
                        <div className="mb-4 h-4 w-1/3 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                <div
                                    key={`skeleton-${n}`}
                                    className="h-4 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="rounded-3xl border border-red-400/50 bg-white dark:bg-gray-800/60 p-10 text-center text-red-600 dark:text-red-300">
                        <h2 className="text-xl font-semibold">{error}</h2>
                        <p className="mt-4 text-sm text-red-400">
                            Return to the{" "}
                            <Link href="/blogs" className="font-semibold text-emerald-600 dark:text-emerald-400">
                                blog index
                            </Link>{" "}
                            for other stories.
                        </p>
                    </div>
                )}
                {/* Blog Content */}
                <article className=" px-4 sm:px-6 lg:px-8 pb-20">
                    {/* Meta Info + Share */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 pb-6">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center">
                                <FiCalendar className="mr-2 h-4 w-4" />
                                <span>{blog ? formatDate(blog.date) : ""}</span>
                            </div>
                            <div className="flex items-center">
                                <FiClock className="mr-2 h-4 w-4" />
                                <span>
                                    {blog
                                        ? `${estimateReadingTime(blog.content.markdown)} min read`
                                        : ""}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleShare}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600/50 hover:border-emerald-400 transition-all"
                            >
                                <FiShare2 className="h-4 w-4" />
                                <span>Share</span>
                            </button>
                            {copied && (
                                <span className="text-sm text-green-600 dark:text-green-400">Link copied</span>
                            )}
                        </div>
                    </div>
                    {/* Title */}
                    <header className="mb-8">
                        <div className="mb-4">
                            <Link
                                href="/blogs"
                                className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                                <FiArrowLeft className="mr-2 h-4 w-4" /> Back to all articles
                            </Link>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            {blog?.title}
                        </h1>
                    </header>

                    {/* Author Section - Genetic Engineering Themed */}
                    {blog?.authors && blog.authors.length > 0 && (
                        <div className="mb-12 relative">
                            {/* Molecule pattern background */}
                            <div className="absolute inset-0 opacity-5">
                                <svg
                                    className="h-full w-full"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <pattern
                                        id="molecules"
                                        x="0"
                                        y="0"
                                        width="60"
                                        height="60"
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <circle cx="30" cy="30" r="2" fill="currentColor" />
                                        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                                        <circle cx="50" cy="10" r="1.5" fill="currentColor" />
                                        <circle cx="10" cy="50" r="1.5" fill="currentColor" />
                                        <circle cx="50" cy="50" r="1.5" fill="currentColor" />
                                        <line
                                            x1="30"
                                            y1="30"
                                            x2="10"
                                            y2="10"
                                            stroke="currentColor"
                                            strokeWidth="0.5"
                                        />
                                        <line
                                            x1="30"
                                            y1="30"
                                            x2="50"
                                            y2="10"
                                            stroke="currentColor"
                                            strokeWidth="0.5"
                                        />
                                        <line
                                            x1="30"
                                            y1="30"
                                            x2="10"
                                            y2="50"
                                            stroke="currentColor"
                                            strokeWidth="0.5"
                                        />
                                        <line
                                            x1="30"
                                            y1="30"
                                            x2="50"
                                            y2="50"
                                            stroke="currentColor"
                                            strokeWidth="0.5"
                                        />
                                    </pattern>
                                    <rect width="100%" height="100%" fill="url(#molecules)" />
                                </svg>
                            </div>

                            <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800/60 dark:via-gray-800/50 dark:to-gray-900/50 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900 shadow-lg">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-wrap gap-4 flex-1">
                                        {blog.authors.map((author, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 flex-1 min-w-[250px] border border-gray-100 dark:border-gray-800 hover:border-emerald-400 transition-all hover:shadow-md group"
                                            >
                                                {author.imageUrl && (
                                                    <div className="relative">
                                                        <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-emerald-400 group-hover:ring-emerald-500 transition-all">
                                                            <img
                                                                src={author.imageUrl}
                                                                alt={author.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        {/* DNA strand decoration */}
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                                            <svg
                                                                className="w-3 h-3"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-gray-900 dark:text-white text-base">
                                                            {author.name}
                                                        </span>
                                                    </div>
                                                    {author.role && (
                                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2 uppercase tracking-wide">
                                                            {author.role}
                                                        </p>
                                                    )}
                                                    {author.bio && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                                            {author.bio.substring(0, 120)}
                                                            {author.bio.length > 120 ? "..." : ""}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Blog Content */}
                    <div className="prose lg:prose-xl max-w-none dark:prose-invert">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                ...markdownComponents,
                                // Add explicit handling for potentially unsafe elements if needed, 
                                // or simply rely on rehype-raw to passthrough HTML. 
                                // We can add specific styling for iframes if desired, but raw is sufficient for basic support.
                                div: ({ node, ...props }) => <div {...props} />, // Ensure divs work if passed in raw HTML
                                iframe: ({ node, ...props }) => {
                                    let src = props.src as string;
                                    // Transform standard YouTube watch links to embed links
                                    if (src && (src.includes('youtube.com/watch') || src.includes('youtu.be/'))) {
                                        try {
                                            const url = new URL(src);
                                            let videoId = '';
                                            if (src.includes('youtube.com/watch')) {
                                                videoId = url.searchParams.get('v') || '';
                                            } else if (src.includes('youtu.be/')) {
                                                videoId = url.pathname.slice(1);
                                            }
                                            if (videoId) {
                                                src = `https://www.youtube.com/embed/${videoId}`;
                                            }
                                        } catch (e) {
                                            // Fallback to original src if parsing fails
                                        }
                                    }
                                    return (
                                        <div className="aspect-video w-full my-6 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
                                            <iframe
                                                {...props}
                                                src={src}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    );
                                }
                            }}
                        >
                            {blog?.content.markdown}
                        </ReactMarkdown>
                    </div>

                    {/* Tags */}
                    {blog?.tags && blog.tags.length > 0 && (
                        <div className="mt-10 flex flex-wrap gap-2">
                            {blog.tags.map((tag) => (
                                <span
                                    key={tag.slug}
                                    className="rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 hover:shadow-md transition-all"
                                >
                                    #{tag.title}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="mt-10 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <Link
                            href="/blogs"
                            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
                        >
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

export default BlogDetailClient;
