import React from "react";
import { Link } from "react-router-dom";
import type { BlogListEntry } from "../../../types/blog";

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
      <h4 className="mb-4 text-sm font-semibold text-slate-700">
        Related posts
      </h4>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {related.map((r) => (
          <Link
            key={r.slug}
            to={`/blogs/${r.slug}`}
            className="block overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-md transition-transform duration-150 ease-out"
          >
            <div className="h-40 w-full overflow-hidden bg-slate-100">
              {r.imageUrl ? (
                <img
                  src={r.imageUrl}
                  alt={r.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-500">
                  <span className="font-semibold text-lg">
                    {r.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="text-sm font-semibold text-slate-900 leading-tight">
                {r.title}
              </div>
              <div className="mt-1 text-xs text-slate-500">
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
