import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#10B981] shadow-lg shadow-[#1E3A8A]/20">
          <img
            src="/zygotrix-logo.png"
            alt="Zygotrix logo"
            className="h-9 w-9 object-contain"
          />
        </div>
        <div>
          <p className="text-xl font-semibold uppercase tracking-[0.4em] text-[#1E3A8A]">Zygotrix</p>
          <p className="text-sm text-slate-500">Genetics intelligence engine</p>
        </div>
      </div>
      <a
        href="#cta"
        className="hidden rounded-full border border-[#1E3A8A]/20 bg-white px-5 py-2 text-sm font-semibold text-[#1E3A8A] shadow-sm shadow-[#1E3A8A]/10 transition hover:border-[#1E3A8A]/40 hover:shadow-[#1E3A8A]/30 sm:inline-flex"
      >
        Request demo
      </a>
    </nav>
  );
};

export default Navbar;