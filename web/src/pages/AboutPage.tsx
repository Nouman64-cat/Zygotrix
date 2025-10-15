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

const cardPalettes = [
  {
    cardClass: "bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30",
    overlayClass:
      "bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-pink-400/5",
    glowGradient: "from-blue-400 to-purple-400",
    titleGradient: "from-slate-900 to-blue-900",
    hoverTitleGradient: "group-hover:from-blue-600 group-hover:to-purple-600",
    arrowColor: "text-blue-600",
  },
  {
    cardClass: "bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30",
    overlayClass:
      "bg-gradient-to-br from-pink-400/5 via-purple-400/5 to-blue-400/5",
    glowGradient: "from-pink-400 to-purple-400",
    titleGradient: "from-slate-900 to-pink-900",
    hoverTitleGradient: "group-hover:from-pink-600 group-hover:to-purple-600",
    arrowColor: "text-pink-600",
  },
  {
    cardClass: "bg-gradient-to-br from-white via-emerald-50/30 to-cyan-50/30",
    overlayClass:
      "bg-gradient-to-br from-emerald-400/5 via-cyan-400/5 to-blue-400/5",
    glowGradient: "from-emerald-400 to-cyan-400",
    titleGradient: "from-slate-900 to-emerald-900",
    hoverTitleGradient: "group-hover:from-emerald-600 group-hover:to-cyan-600",
    arrowColor: "text-emerald-600",
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
    <div className="bg-gradient-to-b from-white via-blue-50/30 to-slate-50 min-h-screen">
      {/* Background Pattern */}
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

      {/* Floating Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-24">
        {/* Hero Section */}
        <div className="grid gap-16 lg:grid-cols-[1.2fr,1fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-100/80 to-purple-100/80 px-6 py-3 backdrop-blur-sm border border-blue-200/50">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">
                Our Story
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent sm:text-6xl">
              Zygotrix is crafted for teams who translate
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}
                  genetics{" "}
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </span>
              into action.
            </h1>

            <p className="text-lg leading-relaxed text-slate-600 max-w-2xl">
              We believe that understanding inheritance patterns should feel
              intuitive, whether you are prototyping in a notebook or running
              production simulations. Zygotrix distills complex models into
              approachable building blocks so you can focus on insight
              generation.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="mailto:hello@zygotrix.io"
                className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-500/25 transition-all hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105"
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
                className="inline-flex items-center justify-center rounded-2xl border-2 border-blue-200 bg-white/80 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:scale-105"
              >
                Meet the team
              </a>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-400/20 via-purple-400/20 to-emerald-400/20 blur-2xl animate-pulse" />
              <div className="relative overflow-hidden rounded-3xl border-2 border-white/60 bg-white/80 backdrop-blur-lg p-10 shadow-2xl shadow-blue-500/20">
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
                <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse delay-1000" />

                <img src={logo} alt="Zygotrix" className="mx-auto w-36 mb-6" />
                <p className="text-center text-sm leading-relaxed text-slate-600">
                  Merging Mendelian logic, polygenic scoring, and thoughtful
                  interaction design into a single learning platform.
                </p>

                <div className="mt-6 flex justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team section */}
        <div id="team" className="mt-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-purple-100/80 to-pink-100/80 px-6 py-3 backdrop-blur-sm border border-purple-200/50 mb-6">
              <FaUsers className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-700">
                Our Team
              </span>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-4">
              Meet the minds behind Zygotrix
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
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
                  className="h-80 rounded-3xl border-2 border-white/60 bg-white/60 shadow-lg animate-pulse"
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
                console.log(isFounder);
                const badgeLabel = isFounder ? "Founder" : "Contributor";
                const badgeClasses = isFounder
                  ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-200"
                  : "bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border border-emerald-200";

                return (
                  <Link
                    key={member.slug}
                    to={`/team/${member.slug}`}
                    className={`group relative overflow-hidden rounded-3xl border-2 border-white/80 ${palette.cardClass} p-8 shadow-xl shadow-slate-500/10 transition-all hover:shadow-2xl hover:shadow-slate-500/20 hover:scale-[1.02]`}
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
                      <p className="text-sm text-slate-600 mt-1 mb-2">
                        {member.role}
                      </p>

                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        <span
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${badgeClasses}`}
                        >
                          {badgeLabel}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed">
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
                                aria-label={`${
                                  member.name
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
            <div className="mt-10 mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/70 p-8 text-center shadow-md">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Team roster coming soon
              </h3>
              <p className="text-slate-600">
                Our Hygraph workspace does not have any published team members
                yet. Check back soon to learn more about the people building
                Zygotrix.
              </p>
            </div>
          )}
        </div>

        {/* Values section */}
        <div className="mt-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-100/80 to-cyan-100/80 px-6 py-3 backdrop-blur-sm border border-emerald-200/50 mb-6">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Our Values
              </span>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-cyan-900 bg-clip-text text-transparent mb-4">
              What guides us
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.name}
                  className="group relative overflow-hidden rounded-3xl border-2 border-white/80 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/30 p-8 shadow-xl shadow-slate-500/10 transition-all hover:shadow-2xl hover:shadow-slate-500/20 hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-400/5 via-blue-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${value.color} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-900 transition-colors">
                      {value.name}
                    </h3>

                    <p className="text-slate-600 leading-relaxed">
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
