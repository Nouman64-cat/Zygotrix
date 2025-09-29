import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../public/zygotrix-logo.png";
const footerLinks = [
  {
    heading: "Navigation",
    links: [
      { label: "Home", to: "/" },
      { label: "About", to: "/about" },
      { label: "Playground", to: "/playground" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "API docs", to: "/playground#live" },
      { label: "Trait registry", to: "/playground#manage" },
      { label: "Changelog", to: "/about#timeline" },
    ],
  },
];

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-[-1px] bg-slate-950 text-slate-200">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#10B981]/40 to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:flex-row lg:justify-between">
        <div className="max-w-sm space-y-3">
          <div className="inline-flex items-center gap-2">
            <div>
              <img src={logo} alt="Zygotrix" className="w-[3rem]" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold uppercase tracking-[0.35em] text-white">
                Zygotrix
              </p>
              <p className="text-xs font-medium text-white/70">
                Genetics intelligence engine
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Uniting Mendelian ratios, polygenic scores, and expressive trait
            registries in a toolkit that feels designed for humans.
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-[#3B82F6]">
            {new Date().getFullYear()} � Crafted for discovery
          </p>
        </div>

        <div className="grid flex-1 gap-12 sm:grid-cols-2 lg:max-w-xl">
          {footerLinks.map((section) => (
            <div key={section.heading}>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                {section.heading}
              </p>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-300 transition hover:text-white hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Stay in sync
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Subscribe for release notes and genetics insights�one concise
              email per month.
            </p>
            <form
              className="mt-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2 py-1 shadow-inner"
              onSubmit={(event) => {
                event.preventDefault();
                window.open(
                  "mailto:hello@zygotrix.io?subject=Newsletter",
                  "_blank"
                );
              }}
            >
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 rounded-full bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#1E3A8A] shadow shadow-black/20 transition hover:shadow-black/40"
              >
                Notify me
              </button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
