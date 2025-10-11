import React from "react";
import { Link } from "react-router-dom";
import { FaLinkedin, FaGithub, FaUsers } from "react-icons/fa";
import { HiBeaker, HiCog } from "react-icons/hi";

import logo from "../../public/zygotrix-logo.png";

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

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {/* Member: Nouman Ejaz */}
            <Link
              to="/team/nouman-ejaz"
              className="group relative overflow-hidden rounded-3xl border-2 border-white/80 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 p-8 shadow-xl shadow-blue-500/10 transition-all hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02]"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-pink-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Avatar with enhanced styling */}
              <div className="relative mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                  <img
                    src="https://gravatar.com/avatar/05ed2a266f4c7ec07bd9c099c0b2362998b6a27ff94a01626bece2b4bb614af5?v=1757321900000&size=256&d=initials"
                    alt="Nouman Ejaz avatar"
                    className="relative h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 p-2 shadow-lg">
                    <FaGithub className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="relative text-center">
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                  Nouman Ejaz
                </h3>
                <p className="text-sm text-slate-600 mt-1 mb-4">
                  Software Engineer
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <span className="rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200">
                    Founder
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-emerald-100 to-cyan-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    Maintainer
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Founder and maintainer, Nouman builds reliable genetic
                  analysis tools. He ensures Zygotrix is intuitive, rigorous,
                  and extensible for teams translating complex inheritance
                  models into actionable insights.
                </p>

                {/* Social links */}
                <div className="mt-6 flex justify-center gap-4">
                  <a
                    href="https://www.linkedin.com/in/nouman-ejaz-64251125b/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white p-3 shadow-md hover:shadow-lg transition-all hover:scale-110 text-blue-600 hover:text-blue-700"
                    aria-label="LinkedIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaLinkedin className="h-5 w-5" />
                  </a>
                  <a
                    href="https://github.com/Nouman64-cat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white p-3 shadow-md hover:shadow-lg transition-all hover:scale-110 text-slate-700 hover:text-slate-900"
                    aria-label="GitHub"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaGithub className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {/* Hover indicator */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg">
                  <svg
                    className="h-4 w-4 text-blue-600"
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

            {/* Other team members with similar styling... */}
            <Link
              to="/team/tooba-noor"
              className="group relative overflow-hidden rounded-3xl border-2 border-white/80 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 p-8 shadow-xl shadow-pink-500/10 transition-all hover:shadow-2xl hover:shadow-pink-500/20 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400/5 via-purple-400/5 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                  <img
                    src="/tooba.jpg"
                    alt="Tooba Noor ul Eman"
                    className="relative h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 p-2 shadow-lg">
                    <FaLinkedin className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="relative text-center">
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-pink-900 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-purple-600 transition-all duration-300">
                  Tooba Noor ul Eman
                </h3>
                <p className="text-sm text-slate-600 mt-1 mb-4">
                  Independent Researcher, BS Biochemistry
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <span className="rounded-full bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-1.5 text-xs font-semibold text-pink-700 border border-pink-200">
                    Contributor
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Tooba, a biochemistry researcher, contributes genetics
                  expertise to Zygotrix. She refines trait models and supports
                  scientific accuracy, making genetic analysis accessible for
                  diverse teams.
                </p>

                <div className="mt-6 flex justify-center gap-4">
                  <a
                    href="https://www.linkedin.com/in/tooba-noor-540556358/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white p-3 shadow-md hover:shadow-lg transition-all hover:scale-110 text-pink-600 hover:text-pink-700"
                    aria-label="LinkedIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaLinkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg">
                  <svg
                    className="h-4 w-4 text-pink-600"
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

            {/* Team Member: Anaab Fatimah */}
            <Link
              to="/team/anaab-fatima"
              className="group relative overflow-hidden rounded-3xl border-2 border-white/80 bg-gradient-to-br from-white via-emerald-50/30 to-cyan-50/30 p-8 shadow-xl shadow-emerald-500/10 transition-all hover:shadow-2xl hover:shadow-emerald-500/20 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-cyan-400/5 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                  <div className="relative h-20 w-20 rounded-full border-4 border-white bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-emerald-700">
                      AF
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 p-2 shadow-lg">
                    <FaLinkedin className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="relative text-center">
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-emerald-900 bg-clip-text text-transparent group-hover:from-emerald-600 group-hover:to-cyan-600 transition-all duration-300">
                  Anaab Fatima
                </h3>
                <p className="text-sm text-slate-600 mt-1 mb-4">
                  Independent Researcher
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <span className="rounded-full bg-gradient-to-r from-emerald-100 to-cyan-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    Contributor
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Anaab Fatima is an independent researcher focused on genetic
                  modeling, inheritance mechanisms, and predictive trait
                  analysis. She refines trait models and supports scientific
                  accuracy, making genetic analysis accessible for diverse
                  teams.
                </p>

                <div className="mt-6 flex justify-center gap-4">
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white p-3 shadow-md hover:shadow-lg transition-all hover:scale-110 text-emerald-600 hover:text-emerald-700"
                    aria-label="LinkedIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaLinkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg">
                  <svg
                    className="h-4 w-4 text-emerald-600"
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

            {/* Team Member: Abdul Roheem */}
            <Link
              to="/team/abdulroheem"
              className="group relative overflow-hidden rounded-3xl border-2 border-white/80 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/30 p-8 shadow-xl shadow-indigo-500/10 transition-all hover:shadow-2xl hover:shadow-indigo-500/20 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 via-violet-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                  <div className="relative h-20 w-20 rounded-full border-4 border-white bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-indigo-700">
                      AR
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 p-2 shadow-lg">
                    <FaLinkedin className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="relative text-center">
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-violet-600 transition-all duration-300">
                  Abdulroheem Agboola
                </h3>
                <p className="text-sm text-slate-600 mt-1 mb-4">
                  Research Contributor
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <span className="rounded-full bg-gradient-to-r from-indigo-100 to-violet-100 px-4 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                    Contributor
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Abdul contributes to Zygotrix's development and research
                  initiatives, supporting the platform's growth and helping
                  advance genetic analysis tools for the research community.
                </p>

                <div className="mt-6 flex justify-center gap-4">
                  <a
                    href="https://www.linkedin.com/in/roheem-agboola-b29673215/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white p-3 shadow-md hover:shadow-lg transition-all hover:scale-110 text-indigo-600 hover:text-indigo-700"
                    aria-label="LinkedIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaLinkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg">
                  <svg
                    className="h-4 w-4 text-indigo-600"
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
          </div>
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
