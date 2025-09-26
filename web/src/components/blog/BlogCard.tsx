import React from "react";
import { Link } from "react-router-dom";

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
              <span className="text-lg font-semibold">{blog.title.charAt(0)}</span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
          <span>{formatDate(blog.date)}</span>
          {blog.categories.length > 0 && (
            <span className="flex items-center gap-2">
              {blog.categories.slice(0, 2).map((category) => (
                <span
                  key={category.slug}
                  className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600"
                >
                  {category.title}
                </span>
              ))}
              {blog.categories.length > 2 && <span>+{blog.categories.length - 2}</span>}
            </span>
          )}
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
