import React from "react";
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

const TeamMemberPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { teamMember, loading, error } = useTeamMember(slug || "");

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
        return "hover:text-[#0A66C2] hover:bg-[#0A66C2]/10";
      case "github":
        return "hover:text-gray-900 hover:bg-gray-900/10";
      case "twitter":
        return "hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10";
      case "instagram":
        return "hover:text-[#E4405F] hover:bg-[#E4405F]/10";
      default:
        return "hover:text-blue-600 hover:bg-blue-600/10";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-6 py-24">
          {/* Back button skeleton */}
          <div className="mb-8">
            <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Content skeleton */}
          <div className="grid gap-12 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-8">
              {/* Header skeleton */}
              <div className="space-y-4">
                <div className="h-12 w-3/4 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-6 w-1/2 bg-slate-200 rounded-lg animate-pulse"></div>
              </div>

              {/* Bio skeleton */}
              <div className="space-y-4">
                <div className="h-6 w-full bg-slate-200 rounded animate-pulse"></div>
                <div className="h-6 w-full bg-slate-200 rounded animate-pulse"></div>
                <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-6 w-full bg-slate-200 rounded animate-pulse"></div>
                <div className="h-6 w-2/3 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="space-y-6">
              <div className="w-64 h-64 bg-slate-200 rounded-2xl animate-pulse mx-auto"></div>
              <div className="space-y-3">
                <div className="h-10 w-full bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-10 w-full bg-slate-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !teamMember) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <Link
            to="/about"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 mb-8"
          >
            <FaArrowLeft className="h-4 w-4" />
            Back to About
          </Link>

          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Team Member Not Found
            </h1>
            <p className="text-slate-600 mb-8">
              {error ||
                "The team member you're looking for doesn't exist or may have been removed."}
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-6 py-3 text-white font-medium transition hover:bg-[#162b63]"
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
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-24">
        {/* Back Button */}
        <Link
          to="/about"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 mb-8 shadow-sm"
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
          {/* Left Column */}
          <div className="space-y-4">
            {/* name */}
            <h1 className="text-3xl font-bold text-[#1E3A8A] lg:text-4xl">
              {teamMember.name}
            </h1>
            {/* role */}
            <span className="inline-block rounded-full bg-[#1E3A8A]/10 px-4 py-2 text-base font-semibold text-[#1E3A8A]">
              {teamMember.role}
            </span>
            {/* bio */}
            <div className="prose prose-slate prose-lg max-w-none prose-headings:text-[#1E3A8A] prose-strong:text-[#1E3A8A] prose-links:text-blue-600 prose-links:no-underline hover:prose-links:underline prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6 [&>p]:mb-6 [&>p:last-child]:mb-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {teamMember.bio.markdown}
              </ReactMarkdown>
            </div>
          </div>
          {/* Right Column */}
          <div className="space-y-6 lg:border-l lg:pl-8 lg:border-slate-200">
            {/* image */}
            <div className="relative z-10 overflow-hidden rounded-2xl border border-white bg-white/90 p-4 shadow-xl shadow-[#1E3A8A]/10 max-w-sm mx-auto lg:mx-0">
              <div className="aspect-square overflow-hidden rounded-xl">
                <img
                  src={teamMember.photo.url}
                  alt={teamMember.name}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                />
              </div>
            </div>
            {/* social links */}
            {teamMember.socialProfiles &&
              teamMember.socialProfiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-[#1E3A8A] uppercase tracking-wide">
                    Connect
                  </h3>
                  <div className="space-y-2">
                    {teamMember.socialProfiles.map((profile) => (
                      <a
                        key={`${profile.platform}-${profile.username}`}
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 backdrop-blur-sm p-3 text-slate-700 transition ${getSocialColor(
                          profile.platform
                        )} hover:border-transparent hover:shadow-md group hover:bg-white`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 group-hover:bg-white transition-colors">
                          {getSocialIcon(profile.platform)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 capitalize">
                            {profile.platform}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            @{profile.username}
                          </div>
                        </div>
                        <FaExternalLinkAlt className="h-3 w-3 text-slate-400 group-hover:text-current transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberPage;
