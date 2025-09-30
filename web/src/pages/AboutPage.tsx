import React from "react";
import { FaLinkedin, FaGithub } from "react-icons/fa";

import logo from "../../public/zygotrix-logo.png";

const values = [
  {
    name: "Scientific rigor",
    description:
      "Probability engines are validated against published ratios and unit tests, keeping outputs predictable and reproducible.",
  },
  {
    name: "Design empathy",
    description:
      "Interfaces are built for cross-functional teams so engineers, geneticists, and operators work from a shared language.",
  },
  {
    name: "Extensible tooling",
    description:
      "Traits, weights, and downstream pipelines are modular so teams can adapt Zygotrix to bespoke research programs.",
  },
];

const AboutPage: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.4fr,1fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-3 rounded-full bg-[#1E3A8A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#1E3A8A]">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" /> Our story
            </span>
            <h1 className="text-4xl font-bold text-[#1E3A8A] sm:text-5xl">
              Zygotrix is crafted for teams who translate genetics into action.
            </h1>
            <p className="text-base text-slate-600">
              We believe that understanding inheritance patterns should feel
              intuitive, whether you are prototyping in a notebook or running
              production simulations. Zygotrix distills complex models into
              approachable building blocks so you can focus on insight
              generation.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:hello@zygotrix.io"
                className="inline-flex items-center justify-center rounded-full bg-[#1E3A8A] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/30 transition hover:bg-[#162b63]"
              >
                Contact us
              </a>
              <a
                href="#milestones"
                className="inline-flex items-center justify-center rounded-full border border-[#1E3A8A]/40 px-5 py-2 text-sm font-semibold text-[#1E3A8A] transition hover:border-[#1E3A8A]/60"
              >
                View milestones
              </a>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#1E3A8A]/10 via-[#3B82F6]/10 to-[#10B981]/10 blur-xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white bg-white/90 p-8 shadow-2xl shadow-[#1E3A8A]/20">
                <img src={logo} alt="Zygotrix" className="mx-auto w-32" />
                <p className="mt-6 text-center text-sm text-slate-600">
                  Merging Mendelian logic, polygenic scoring, and thoughtful
                  interaction design into a single learning platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Teams section */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr,1fr]">
          <div className="rounded-3xl border border-white/70 bg-white/95 p-8 shadow-xl shadow-slate-200/60">
            <h2 className="text-xl font-semibold text-[#1E3A8A]">Team</h2>
            <p className="mt-3 text-sm text-slate-600">
              Core contributors and collaborators who help steer Zygotrix.
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {/* Member: Nouman Ejaz */}
              <div className="relative flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 shadow-lg transition hover:shadow-xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1E3A8A]/10 mb-4 overflow-hidden">
                  <img
                    src="https://gravatar.com/avatar/05ed2a266f4c7ec07bd9c099c0b2362998b6a27ff94a01626bece2b4bb614af5?v=1757321900000&size=256&d=initials"
                    alt="Nouman Ejaz avatar"
                    className="h-16 w-16 object-cover"
                  />
                </div>
                <div className="text-center">
                  <div className="text-base font-semibold text-[#1E3A8A]">
                    Nouman Ejaz
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Software Engineer
                  </div>
                  <span className="mt-2 inline-block rounded-full bg-[#1E3A8A]/10 px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
                    Founder
                  </span>
                  <span className="mt-2 ml-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Maintainer
                  </span>
                </div>
                {/* Social links bottom right */}
                <div className="absolute bottom-4 right-4 flex gap-3">
                  <a
                    href="https://www.linkedin.com/in/nouman-ejaz-64251125b/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-[#0A66C2] cursor-pointer transition-colors"
                    aria-label="LinkedIn"
                  >
                    <FaLinkedin className="h-5 cursor-pointer w-5" />
                  </a>
                  <a
                    href="https://github.com/Nouman64-cat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-black cursor-pointer transition-colors"
                    aria-label="GitHub"
                  >
                    <FaGithub className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {/* Member: Tooba Noor ul Eman */}
              <div className="relative flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 shadow-lg transition hover:shadow-xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1E3A8A]/10 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-8 w-8 text-[#1E3A8A]"
                  >
                    <circle
                      cx="12"
                      cy="8"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-base font-semibold text-[#1E3A8A]">
                    Tooba Noor ul Ieman
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Independent Researcher, BS Biochemistry
                  </div>
                  <span className="mt-2 inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                    Contributor
                  </span>
                </div>
                {/* Social links bottom right */}
                <div className="absolute bottom-4 right-4 flex gap-3">
                  <a
                    href="https://www.linkedin.com/in/tooba-noor-540556358/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-[#0A66C2] cursor-pointer transition-colors"
                    aria-label="LinkedIn"
                  >
                    <FaLinkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.4fr,1fr]">
          <div className="rounded-3xl border border-white/70 bg-white/95 p-8 shadow-xl shadow-slate-200/60">
            <h2 className="text-xl font-semibold text-[#1E3A8A]">
              What guides us
            </h2>
            <ul className="mt-6 space-y-6">
              {values.map((value) => (
                <li
                  key={value.name}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <p className="text-base font-semibold text-[#1E3A8A]">
                    {value.name}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {value.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
