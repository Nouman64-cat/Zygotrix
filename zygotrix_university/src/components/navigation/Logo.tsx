import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "default" | "compact";
}

const Logo = ({ variant = "default" }: LogoProps) => {
  if (variant === "compact") {
    return (
      <Link to="/" className="inline-flex items-center gap-2 text-white">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-blue-400 text-base font-bold shadow-lg shadow-indigo-500/30">
          ZU
        </span>
      </Link>
    );
  }

  return (
    <Link to="/" className="group inline-flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-blue-400 text-lg font-bold text-white shadow-lg shadow-indigo-500/30 transition group-hover:scale-[1.03]">
        ZU
      </span>
      <div className="flex flex-col">
        <span className="text-lg font-semibold tracking-tight text-white">
          Zygotrix
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.32em] text-indigo-200">
          University
        </span>
      </div>
    </Link>
  );
};

export default Logo;
