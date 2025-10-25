import { useState } from "react";
import {
  FiMenu,
  FiX,
  FiArrowUpRight,
  FiLogOut,
  FiMoon,
  FiSun,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import AccentButton from "../common/AccentButton";
import Logo from "./Logo";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

// const navItems = [
//   // { label: "Programs", to: "/courses" },
//   // { label: "Learning Paths", to: "/paths" },
//   // { label: "Practice Studio", to: "/practice" },
//   // { label: "Community", to: "/community" },
//   // { label: "Resources", to: "/resources" },
// ];

const ZYGOTRIX_STUDIO_URL = import.meta.env.VITE_ZYGOTRIX_STUDIO_APP;

const NavigationBar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-overlay backdrop-blur transition-colors">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {/* {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium text-muted transition-colors hover:text-foreground",
                  isActive &&
                    "text-foreground underline underline-offset-8 decoration-[var(--color-primary)]"
                )
              }
            >
              {item.label}
            </NavLink>
          ))} */}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to={`${ZYGOTRIX_STUDIO_URL}/studio`}
            className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-foreground"
          >
            Zygotrix Studio <FiArrowUpRight />
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-secondary-button bg-secondary-button text-foreground transition-colors hover:bg-secondary-button-hover"
            aria-label="Toggle theme"
          >
            {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          {user ? (
            <>
              <AccentButton to="/university" variant="primary">
                Go to University
              </AccentButton>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-full border border-secondary-button bg-secondary-button px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-secondary-button transition-colors hover:bg-secondary-button-hover"
              >
                <FiLogOut /> Sign out
              </button>
            </>
          ) : (
            <AccentButton to="/signin" variant="primary">
              Sign in
            </AccentButton>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors md:hidden"
          onClick={toggle}
          aria-label="Toggle menu"
        >
          {open ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

        {open && (
          <div className="absolute inset-x-0 top-full border-b border-border bg-overlay px-4 pb-6 pt-4 shadow-lg shadow-black/20 md:hidden transition-colors">
            <div className="flex flex-col gap-3">
              {/* {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={close}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2 text-base font-medium text-muted transition-colors hover:bg-accent-soft hover:text-foreground",
                      isActive && "bg-accent-soft text-foreground"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))} */}
              <hr className="border-border" />
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  close();
                }}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-base font-medium text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
              >
                <span>
                  {isDark ? "Switch to light mode" : "Switch to dark mode"}
                </span>
                {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>
              {user ? (
                <>
                  <AccentButton
                    to="/university"
                    onClick={close}
                    variant="secondary"
                  >
                    Go to University
                  </AccentButton>
                  <button
                    onClick={() => {
                      close();
                      handleSignOut();
                    }}
                    className="flex items-center justify-center gap-2 rounded-full border border-secondary-button bg-secondary-button px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-secondary-button transition-colors hover:bg-secondary-button-hover"
                  >
                    <FiLogOut /> Sign out
                  </button>
                </>
              ) : (
                <AccentButton to="/signin" onClick={close} variant="secondary">
                  Sign in
                </AccentButton>
              )}
              <Link
                to={`${ZYGOTRIX_STUDIO_URL}/studio`}
                onClick={close}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-accent transition-colors hover:bg-accent-soft hover:text-foreground"
              >
                Zygotrix Studio <FiArrowUpRight />
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default NavigationBar;
