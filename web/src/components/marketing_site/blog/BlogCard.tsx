import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiShare2 } from "react-icons/fi";

import type { BlogListEntry } from "../../../types/blog";

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
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/blogs/${blog.slug}`} aria-label={`Read ${blog.title}`}>
        <div className="aspect-[3/2] w-full overflow-hidden bg-slate-100">
          {blog.imageUrl ? (
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 text-blue-600">
              <span className="text-lg font-semibold">
                {blog.title.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
          <span>{formatDate(blog.date)}</span>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
            aria-label={`Share ${blog.title}`}
          >
            <FiShare2 className="h-4 w-4" />
            <span>{copied ? "Copied" : "Share"}</span>
          </button>
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-900">
            <Link to={`/blogs/${blog.slug}`} className="hover:text-blue-600">
              {blog.title}
            </Link>
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
            {blog.excerpt}
          </p>
        </div>
        <div className="mt-auto flex items-center gap-3">
          {blog.authors.slice(0, 2).map((author) => (
            <div key={author.name} className="flex items-center gap-2">
              {author.imageUrl ? (
                <img
                  src={author.imageUrl}
                  alt={author.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                  {author.name
                    .split(" ")
                    .map((part) => part.charAt(0))
                    .join("")
                    .slice(0, 2)}
                </div>
              )}
              <span className="text-sm font-medium text-slate-700">
                {author.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
