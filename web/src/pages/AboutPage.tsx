import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaLinkedin,
  FaGithub,
  FaUsers,
  FaTwitter,
  FaInstagram,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { HiBeaker, HiCog } from "react-icons/hi";

import { fetchTeamMembers } from "../services/teamMember";
import type { TeamMemberSummary } from "../types/teamMember";
import logo from "../../public/zygotrix-logo.png";
import useDocumentTitle from "../hooks/useDocumentTitle";

const cardPalettes = [
  {
    cardClass: "bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30",
    overlayClass:
      "bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-pink-400/5",
    glowGradient: "from-blue-400 to-purple-400",
    titleGradient: "from-slate-900 to-blue-900 dark:from-white dark:to-blue-200",
    hoverTitleGradient: "group-hover:from-blue-600 group-hover:to-purple-600 dark:group-hover:from-blue-300 dark:group-hover:to-purple-300",
    arrowColor: "text-blue-600 dark:text-blue-400",
  },
  {
    cardClass: "bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30",
    overlayClass:
      "bg-gradient-to-br from-pink-400/5 via-purple-400/5 to-blue-400/5",
    glowGradient: "from-pink-400 to-purple-400",
    titleGradient: "from-slate-900 to-pink-900 dark:from-white dark:to-pink-200",
    hoverTitleGradient: "group-hover:from-pink-600 group-hover:to-purple-600 dark:group-hover:from-pink-300 dark:group-hover:to-purple-300",
    arrowColor: "text-pink-600 dark:text-pink-400",
  },
  {
    cardClass: "bg-gradient-to-br from-white via-emerald-50/30 to-cyan-50/30",
    overlayClass:
      "bg-gradient-to-br from-emerald-400/5 via-cyan-400/5 to-blue-400/5",
    glowGradient: "from-emerald-400 to-cyan-400",
    titleGradient: "from-slate-900 to-emerald-900 dark:from-white dark:to-emerald-200",
    hoverTitleGradient: "group-hover:from-emerald-600 group-hover:to-cyan-600 dark:group-hover:from-emerald-300 dark:group-hover:to-cyan-300",
    arrowColor: "text-emerald-600 dark:text-emerald-400",
  },
] as const;

const inferPlatform = (platform?: string | null, url?: string) => {
  if (platform && platform.trim()) {
    return platform.trim().toLowerCase();
  }

  if (!url) {
    return "website";
  }

  try {
    const host = new URL(url).hostname.toLowerCase();

    if (host.includes("linkedin")) return "linkedin";
    if (host.includes("github")) return "github";
    if (host.includes("twitter") || host.includes("x.com")) return "twitter";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("researchgate")) return "researchgate";
    if (host.includes("academia")) return "academia";
  } catch {
    // Ignore URL parsing failures and fall back to website
  }

  return "website";
};

const getSocialIcon = (platform: string) => {
  switch (platform) {
    case "linkedin":
      return <FaLinkedin className="h-5 w-5" />;
    case "github":
      return <FaGithub className="h-5 w-5" />;
    case "twitter":
      return <FaTwitter className="h-5 w-5" />;
    case "instagram":
      return <FaInstagram className="h-5 w-5" />;
    case "academia":
      return (
        <span
          className="h-5 w-5 flex items-center justify-center font-bold text-2xl text-gray-700"
          style={{ fontFamily: "serif" }}
        >
          A
        </span>
      );
    case "researchgate":
      return (
        <span
          className="h-5 w-5 flex items-center justify-center font-bold text-gray-700"
          style={{ fontFamily: "serif", fontSize: "1.1rem" }}
        >
          R<sup className="text-xs align-super">G</sup>
        </span>
      );
    default:
      return <FaExternalLinkAlt className="h-4 w-4" />;
  }
};

const getSocialButtonClasses = (platform: string) => {
  switch (platform) {
    case "linkedin":
      return "text-blue-600 hover:text-blue-700";
    case "github":
      return "text-slate-700 hover:text-slate-900";
    case "twitter":
      return "text-sky-500 hover:text-sky-600";
    case "instagram":
      return "text-pink-500 hover:text-pink-600";
    case "researchgate":
      return "text-emerald-600 hover:text-emerald-700";
    case "academia":
      return "text-amber-600 hover:text-amber-700";
    default:
      return "text-indigo-600 hover:text-indigo-700";
  }
};

const getPlatformLabel = (platform: string) => {
  switch (platform) {
    case "linkedin":
      return "LinkedIn";
    case "github":
      return "GitHub";
    case "twitter":
      return "Twitter";
    case "instagram":
      return "Instagram";
    case "researchgate":
      return "ResearchGate";
    case "academia":
      return "Academia";
    default:
      return "website";
  }
};

const getInitials = (name: string) => {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
};

const buildFallbackIntro = (member: TeamMemberSummary) => {
  const firstName = member.name.split(" ")[0] || member.name;
  const role = member.role || "team member";
  return `${firstName} contributes to Zygotrix as ${role}.`;
};

const values = [
  {
    name: "Scientific rigor",
    icon: HiBeaker,
    description:
      "Probability engines are validated against published ratios and unit tests, keeping outputs predictable and reproducible.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Design empathy",
    icon: FaUsers,
    description:
      "Interfaces are built for cross-functional teams so engineers, geneticists, and operators work from a shared language.",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Extensible tooling",
    icon: HiCog,
    description:
      "Traits, weights, and downstream pipelines are modular so teams can adapt Zygotrix to bespoke research programs.",
    color: "from-emerald-500 to-teal-500",
  },
];

const AboutPage: React.FC = () => {
  useDocumentTitle("About");

  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    setTeamLoading(true);
    setTeamError(null);

    fetchTeamMembers(controller.signal)
      .then((members) => {
        if (!isMounted) return;
        setTeamMembers(members);
      })
      .catch((error) => {
        if (!isMounted) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setTeamError(
          error instanceof Error ? error.message : "Failed to load team members"
        );
      })
      .finally(() => {
        if (isMounted) {
          setTeamLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [retryKey]);

  const handleRetry = () => setRetryKey((prev) => prev + 1);

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 min-h-screen transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 opacity-[0.02]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="dna-pattern"
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
              <circle cx="25" cy="10" r="2" fill="currentColor" />
              <circle cx="75" cy="10" r="2" fill="currentColor" />
              <circle cx="25" cy="90" r="2" fill="currentColor" />
              <circle cx="75" cy="90" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dna-pattern)" />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-[#1E3A8A]/10 to-[#3B82F6]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-[#3B82F6]/10 to-[#10B981]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-gradient-to-br from-[#10B981]/10 to-[#059669]/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-24">
        <div className="grid gap-16 lg:grid-cols-[1.2fr,1fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#1E3A8A]/10 to-[#10B981]/10 dark:from-[#1E3A8A]/20 dark:to-[#10B981]/20 px-6 py-3 backdrop-blur-sm border border-[#1E3A8A]/20 dark:border-[#3B82F6]/30">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[#1E3A8A] dark:text-[#3B82F6]">
                Our Story
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-tight bg-gradient-to-r from-slate-900 via-[#1E3A8A] to-[#3B82F6] dark:from-white dark:via-[#3B82F6] dark:to-[#10B981] bg-clip-text text-transparent sm:text-6xl">
              Zygotrix is crafted for teams who translate
              <span className="relative">
                <span className="bg-gradient-to-r from-[#3B82F6] to-[#10B981] bg-clip-text text-transparent">
                  {" "}
                  genetics{" "}
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#1E3A8A] to-[#10B981] rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </span>
              into action.
            </h1>

            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
              We believe that understanding inheritance patterns should feel
              intuitive, whether you are prototyping in a notebook or running
              production simulations. Zygotrix distills complex models into
              approachable building blocks so you can focus on insight
              generation.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}
                className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] dark:from-[#3B82F6] dark:to-[#10B981] px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-[#1E3A8A]/25 dark:shadow-[#3B82F6]/25 transition-all hover:shadow-2xl hover:shadow-[#1E3A8A]/40 dark:hover:shadow-[#3B82F6]/40 hover:scale-105"
              >
                <span>Contact us</span>
                <svg
                  className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
              <a
                href="#team"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-[#1E3A8A]/30 dark:border-[#3B82F6]/50 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-[#1E3A8A] dark:text-[#3B82F6] transition-all hover:border-[#1E3A8A] dark:hover:border-[#3B82F6] hover:bg-white dark:hover:bg-slate-700 hover:scale-105"
              >
                Meet the team
              </a>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#1E3A8A]/20 via-[#3B82F6]/20 to-[#10B981]/20 blur-2xl animate-pulse" />
              <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-10 shadow-2xl shadow-[#1E3A8A]/10 dark:shadow-[#3B82F6]/20">
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-full animate-pulse" />
                <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full animate-pulse delay-1000" />

                <img src={logo} alt="Zygotrix" className="mx-auto w-36 mb-6" />
                <p className="text-center text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Merging Mendelian logic, polygenic scoring, and thoughtful
                  interaction design into a single learning platform.
                </p>

                <div className="mt-6 flex justify-center gap-2">
                  <div className="w-2 h-2 bg-[#1E3A8A] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-[#10B981] rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="team" className="mt-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#3B82F6]/10 to-[#10B981]/10 dark:from-[#3B82F6]/20 dark:to-[#10B981]/20 px-6 py-3 backdrop-blur-sm border border-[#3B82F6]/20 dark:border-[#3B82F6]/30 mb-6">
              <FaUsers className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[#3B82F6] dark:text-[#3B82F6]">
                Our Team
              </span>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-[#1E3A8A] to-[#3B82F6] dark:from-white dark:via-[#3B82F6] dark:to-[#10B981] bg-clip-text text-transparent mb-4">
              Meet the minds behind Zygotrix
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Core contributors and collaborators who help guide Zygotrix
              towards making genetics accessible for everyone.
            </p>
          </div>

          {teamError && (
            <div className="mx-auto mb-10 max-w-3xl rounded-3xl border border-red-200 bg-red-50/80 p-6 text-center text-red-600 shadow-sm">
              <p className="text-sm sm:text-base font-semibold">
                We're having trouble loading the team roster.
              </p>
              <p className="mt-2 text-xs sm:text-sm text-red-500/80">
                {teamError}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Try again
              </button>
            </div>
          )}

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {teamLoading &&
              [0, 1, 2].map((index) => (
                <div
                  key={`team-skeleton-${index}`}
                  className="h-80 rounded-3xl border-2 border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 shadow-lg animate-pulse"
                />
              ))}

            {!teamLoading &&
              teamMembers.map((member, index) => {
                const palette = cardPalettes[index % cardPalettes.length];
                const socialProfiles = (member.socialProfiles ?? []).filter(
                  (profile) => profile && profile.url
                );
                const intro =
                  member.introduction && member.introduction.trim().length > 0
                    ? member.introduction
                    : buildFallbackIntro(member);
                const isFounder = Boolean(member.founder);
                const badgeLabel = isFounder ? "Founder" : "Contributor";
                const badgeClasses = isFounder
                  ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-200"
                  : "bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border border-emerald-200";

                return (
                  <Link
                    key={member.slug}
                    to={`/team/${member.slug}`}
                    className={`group relative overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-500/10 transition-all hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02]`}
                  >
                    <div
                      className={`absolute inset-0 ${palette.overlayClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />

                    <div className="relative mb-6 flex justify-center">
                      <div className="relative">
                        <div
                          className={`absolute inset-0 rounded-full bg-gradient-to-r ${palette.glowGradient} blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
                        />
                        {member.photo?.url ? (
                          <img
                            src={member.photo.url}
                            alt={`${member.name} portrait`}
                            className="relative h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-slate-100 to-slate-200 text-2xl font-bold text-slate-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                            {getInitials(member.name)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative text-center">
                      <h3
                        className={`text-xl font-bold bg-gradient-to-r ${palette.titleGradient} bg-clip-text text-transparent transition-all duration-300 ${palette.hoverTitleGradient}`}
                      >
                        {member.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 mb-2">
                        {member.role}
                      </p>

                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        <span
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${badgeClasses}`}
                        >
                          {badgeLabel}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {intro}
                      </p>

                      {socialProfiles.length > 0 && (
                        <div className="mt-6 flex justify-center gap-4">
                          {socialProfiles.map((profile) => {
                            const platform = inferPlatform(
                              profile.platform,
                              profile.url
                            );

                            return (
                              <a
                                key={profile.url}
                                href={profile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`rounded-full bg-white p-3 shadow-md hover:shadow-lg transition-all hover:scale-110 ${getSocialButtonClasses(
                                  platform
                                )}`}
                                aria-label={`${member.name
                                  }'s ${getPlatformLabel(platform)} profile`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                {getSocialIcon(platform)}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg">
                        <svg
                          className={`h-4 w-4 ${palette.arrowColor}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>

          {!teamLoading && teamMembers.length === 0 && !teamError && (
            <div className="mt-10 mx-auto max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 p-8 text-center shadow-md">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Team roster coming soon
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Our Hygraph workspace does not have any published team members
                yet. Check back soon to learn more about the people building
                Zygotrix.
              </p>
            </div>
          )}
        </div>

        <div className="mt-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:to-cyan-500/20 px-6 py-3 backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-500/30 mb-6">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                Our Values
              </span>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-800 to-cyan-800 dark:from-white dark:via-emerald-200 dark:to-cyan-200 bg-clip-text text-transparent mb-4">
              What guides us
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.name}
                  className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-500/10 transition-all hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-400/5 via-blue-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${value.color} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                      {value.name}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
