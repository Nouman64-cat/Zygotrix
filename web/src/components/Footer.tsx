import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
        <p>&copy; {new Date().getFullYear()} Zygotrix. Engineered with care for genetic discovery.</p>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-end">
          <Link to="/" className="transition hover:text-[#1E3A8A]">
            Home
          </Link>
          <Link to="/about" className="transition hover:text-[#1E3A8A]">
            About
          </Link>
          <Link to="/playground" className="transition hover:text-[#1E3A8A]">
            Playground
          </Link>
          <Link to="/contact" className="transition hover:text-[#1E3A8A]">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
