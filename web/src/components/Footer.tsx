import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
        <p>&copy; {new Date().getFullYear()} Zygotrix. Engineered with care for genetic discovery.</p>
        <div className="flex gap-6">
          <a href="#features" className="transition hover:text-[#1E3A8A]">
            Features
          </a>
          <a href="#live-api" className="transition hover:text-[#1E3A8A]">
            Live API
          </a>
          <a href="#cta" className="transition hover:text-[#1E3A8A]">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;