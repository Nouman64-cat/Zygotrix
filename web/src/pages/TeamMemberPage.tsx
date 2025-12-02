import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaInstagram,
  FaArrowLeft,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useTeamMember } from "../hooks/useTeamMember";
import { fetchBlogsByAuthor } from "../services/hygraphApi";
import type { BlogListEntry } from "../types/blog";
import { FiCalendar, FiArrowRight } from "react-icons/fi";

const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-6xl font-bold text-white mt-8 mb-4 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-5xl font-bold text-white mt-8 mb-4">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-4xl font-bold text-white mt-6 mb-3">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-3xl font-bold text-slate-200 mt-6 mb-3">{children}</h4>
  ),
  h5: ({ children }: any) => (
    <h5 className="text-base font-semibold text-slate-300 mt-6 mb-3 uppercase tracking-wide">
      {children}
    </h5>
  ),
  h6: ({ children }: any) => (
    <h6 className="text-sm font-semibold text-slate-400 mt-5 mb-3 uppercase tracking-[0.2em]">
      {children}
    </h6>
  ),
  p: ({ children }: any) => (
    <p className="text-slate-300 text-base leading-relaxed mb-6">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className=" text-base text-slate-300 mb-6 space-y-2">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className=" text-base text-slate-300 mb-6 space-y-2">{children}</ol>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-blue-500 pl-6 py-2 italic text-slate-300 bg-slate-800/50 rounded-r-lg mb-6">
      {children}
    </blockquote>
  ),
  code: ({ children }: any) => (
    <code className="bg-slate-800 text-slate-200 px-2 py-1 rounded text-sm font-mono border border-slate-700">
      {children}
    </code>
  ),
  pre: ({ children }: any) => (
    <pre className="bg-slate-950 text-slate-100 p-6 rounded-lg overflow-x-auto mb-6 border border-slate-800">
      {children}
    </pre>
  ),
};

const TeamMemberPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { teamMember, loading, error } = useTeamMember(slug || "");
  const [authoredBlogs, setAuthoredBlogs] = useState<BlogListEntry[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);

  useEffect(() => {
    if (!teamMember?.name) return;

    const controller = new AbortController();
    setBlogsLoading(true);

    fetchBlogsByAuthor(teamMember.name, controller.signal)
      .then((blogs) => {
        setAuthoredBlogs(blogs);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to load authored blogs", err);
      })
      .finally(() => {
        setBlogsLoading(false);
      });

    return () => controller.abort();
  }, [teamMember?.name]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
      date
    );
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return <FaLinkedin className="h-5 w-5" />;
      case "github":
        return <FaGithub className="h-5 w-5" />;
      case "twitter":
        return <FaTwitter className="h-5 w-5" />;
      case "instagram":
        return <FaInstagram className="h-5 w-5" />;
      default:
        return <FaExternalLinkAlt className="h-4 w-4" />;
    }
  };

  const getSocialColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return "hover:text-[#0A66C2] hover:bg-[#0A66C2]/20";
      case "github":
        return "hover:text-white hover:bg-white/10";
      case "twitter":
        return "hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/20";
      case "instagram":
        return "hover:text-[#E4405F] hover:bg-[#E4405F]/20";
      default:
        return "hover:text-blue-400 hover:bg-blue-400/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-24">
          {/* Back button skeleton */}
          <div className="mb-8">
            <div className="h-10 w-32 bg-slate-700 rounded-lg animate-pulse"></div>
          </div>

          {/* Content skeleton */}
          <div className="grid gap-12 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-8">
              {/* Header skeleton */}
              <div className="space-y-4">
                <div className="h-12 w-3/4 bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-6 w-1/2 bg-slate-700 rounded-lg animate-pulse"></div>
              </div>

              {/* Bio skeleton */}
              <div className="space-y-4">
                <div className="h-6 w-full bg-slate-700 rounded animate-pulse"></div>
                <div className="h-6 w-full bg-slate-700 rounded animate-pulse"></div>
                <div className="h-6 w-3/4 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-6 w-full bg-slate-700 rounded animate-pulse"></div>
                <div className="h-6 w-2/3 bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="space-y-6">
              <div className="w-64 h-64 bg-slate-700 rounded-2xl animate-pulse mx-auto"></div>
              <div className="space-y-3">
                <div className="h-10 w-full bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-10 w-full bg-slate-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !teamMember) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <Link
            to="/about"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 mb-8"
          >
            <FaArrowLeft className="h-4 w-4" />
            Back to About
          </Link>

          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-red-500"
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
            <h1 className="text-2xl font-bold text-white mb-4">
              Team Member Not Found
            </h1>
            <p className="text-slate-400 mb-8">
              {error ||
                "The team member you're looking for doesn't exist or may have been removed."}
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium transition hover:bg-blue-700"
            >
              <FaArrowLeft className="h-4 w-4" />
              Return to Team
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* DNA Pattern Background */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.02]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="team-dna"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M25,10 Q50,30 75,10 M25,90 Q50,70 75,90 M25,10 L25,90 M75,10 L75,90"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
              <circle cx="25" cy="30" r="2" fill="currentColor" />
              <circle cx="75" cy="30" r="2" fill="currentColor" />
              <circle cx="25" cy="60" r="2" fill="currentColor" />
              <circle cx="75" cy="60" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#team-dna)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        {/* Back Button */}
        <Link
          to="/about"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 mb-8 shadow-sm hover:shadow-md"
        >
          <FaArrowLeft className="h-4 w-4" />
          Back to About
        </Link>

        {/* Main Content */}

        {/*
          Layout:
          | name   | image        |
          | role   | social links |
          | bio    |              |
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column (Scrollable) */}
          <div className="space-y-4 overflow-y-auto pr-2 lg:pr-0">
            {/* name */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent lg:text-4xl">
              {teamMember.name}
            </h1>
            {/* role */}
            <span className="inline-block rounded-full bg-gradient-to-r from-blue-900/20 to-blue-600/20 border-2 border-blue-500/30 px-4 py-2 text-base font-semibold text-blue-400">
              {teamMember.role}
            </span>
            {/* bio */}
            <div className="prose prose-invert prose-lg max-w-none prose-headings:text-blue-400 prose-strong:text-blue-400 prose-links:text-blue-400 prose-links:no-underline hover:prose-links:underline prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-6 [&>p]:mb-6 [&>p:last-child]:mb-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {teamMember.bio.markdown}
              </ReactMarkdown>
            </div>
          </div>
          {/* Right Column (Sticky) */}
          <div className="space-y-6 lg:border-l lg:pl-8 lg:border-slate-700 lg:sticky lg:top-24">
            {/* image */}
            <div className="relative z-10 overflow-hidden rounded-2xl border-2 border-blue-500/30 bg-slate-800/90 p-4 shadow-xl shadow-blue-500/10 max-w-sm mx-auto lg:mx-0">
              <div className="aspect-square overflow-hidden rounded-xl ring-2 ring-blue-500/30 flex items-center justify-center bg-slate-800">
                {teamMember.photo && teamMember.photo.url ? (
                  <img
                    src={teamMember.photo.url}
                    alt={teamMember.name}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                ) : (
                  <span className="text-4xl font-bold text-slate-600 select-none">
                    {teamMember.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part.charAt(0).toUpperCase())
                      .join("")}
                  </span>
                )}
              </div>
            </div>
            {/* social links */}
            {teamMember.socialProfiles &&
              teamMember.socialProfiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
                    Connect
                  </h3>
                  <div className="space-y-2">
                    {teamMember.socialProfiles.map((profile) => (
                      <a
                        key={`${profile.platform}-${profile.username}`}
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/80 backdrop-blur-sm p-3 text-slate-300 transition ${getSocialColor(
                          profile.platform
                        )} hover:border-transparent hover:shadow-md group hover:bg-slate-800`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-700 group-hover:bg-slate-700 transition-colors">
                          {getSocialIcon(profile.platform)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white capitalize">
                            {profile.platform}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            @{profile.username}
                          </div>
                        </div>
                        <FaExternalLinkAlt className="h-3 w-3 text-slate-500 group-hover:text-current transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Published Research & Articles Section */}
        {authoredBlogs.length > 0 && (
          <div className="mt-16">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                  Published Research & Articles
                </h2>
              </div>
              <p className="text-slate-400">
                Explore {authoredBlogs.length} research{" "}
                {authoredBlogs.length === 1 ? "article" : "articles"} published
                by {teamMember.name}
              </p>
            </div>

            {/* Blog Cards with Genetic Theme */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {authoredBlogs.map((blog) => (
                <Link
                  key={blog.slug}
                  to={`/blogs/${blog.slug}`}
                  className="group relative overflow-hidden rounded-2xl border-2 border-blue-900/30 bg-gradient-to-br from-slate-800 to-blue-900/10 p-6 shadow-lg transition-all hover:shadow-2xl hover:border-blue-500/50 hover:-translate-y-1"
                >
                  {/* Molecule decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                    <svg
                      className="w-full h-full text-blue-600"
                      viewBox="0 0 100 100"
                      fill="currentColor"
                    >
                      <circle cx="50" cy="50" r="4" />
                      <circle cx="20" cy="20" r="3" />
                      <circle cx="80" cy="20" r="3" />
                      <circle cx="20" cy="80" r="3" />
                      <circle cx="80" cy="80" r="3" />
                      <line
                        x1="50"
                        y1="50"
                        x2="20"
                        y2="20"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <line
                        x1="50"
                        y1="50"
                        x2="80"
                        y2="20"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <line
                        x1="50"
                        y1="50"
                        x2="20"
                        y2="80"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <line
                        x1="50"
                        y1="50"
                        x2="80"
                        y2="80"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>

                  {blog.imageUrl && (
                    <div className="mb-4 aspect-video overflow-hidden rounded-xl ring-2 ring-blue-500/30 group-hover:ring-blue-400 transition-all">
                      <img
                        src={blog.imageUrl}
                        alt={blog.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  )}

                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {blog.title}
                    </h3>

                    <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                      {blog.excerpt}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="h-3 w-3" />
                        <span>{formatDate(blog.date)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-400 font-medium group-hover:gap-2 transition-all">
                        Read More
                        <FiArrowRight className="h-3 w-3" />
                      </div>
                    </div>

                    {/* Categories */}
                    {blog.categories && blog.categories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {blog.categories.slice(0, 2).map((category) => (
                          <span
                            key={category.slug}
                            className="rounded-full bg-blue-900/30 border border-blue-500/30 px-3 py-1 text-xs font-medium text-blue-400"
                          >
                            {category.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Loading State for Blogs */}
        {blogsLoading && (
          <div className="mt-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                Published Research & Articles
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-80 animate-pulse rounded-2xl bg-slate-800/60 shadow-lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* No Blogs State */}
        {!blogsLoading && authoredBlogs.length === 0 && (
          <div className="mt-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                Published Research & Articles
              </h2>
            </div>
            <div className="text-center py-12 rounded-2xl border-2 border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
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
              <p className="text-slate-400">
                {teamMember.name} hasn't published any articles yet. Check back
                later for their research contributions!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMemberPage;
