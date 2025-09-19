import React, { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { fetchPortalStatus } from "../services/authApi";

const PortalPage: React.FC = () => {
  const { user, token } = useAuth();
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const loadStatus = async () => {
      if (!token) {
        setStatusMessage("");
        return;
      }
      try {
        const response = await fetchPortalStatus(token);
        if (isMounted) {
          setStatusMessage(response.message);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError("We could not verify your portal access just now. Please try again.");
        }
      }
    };

    loadStatus();
    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.45em] text-slate-300/80">Secure Portal</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Welcome back{user?.full_name ? `, ${user.full_name}` : ""}</h1>
          <p className="max-w-2xl text-base text-slate-300/90">
            This is your personalized workspace for exploring Zygotrix simulations, saved traits, and
            collaboration tools. Use the quick links below to jump into the capabilities you need.
          </p>
        </header>

        {statusMessage && (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-sm text-slate-100 shadow-xl shadow-black/20">
            {statusMessage}
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <h2 className="text-xl font-semibold">Simulation Playground</h2>
            <p className="mt-2 text-sm text-slate-200/90">
              Run new Mendelian or polygenic simulations with your stored trait configurations.
            </p>
            <a
              href="/playground"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-blue-200"
            >
              Go to playground
              <span aria-hidden="true">&rarr;</span>
            </a>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <h2 className="text-xl font-semibold">Manage Traits</h2>
            <p className="mt-2 text-sm text-slate-200/90">
              Review, update, and organize the trait catalogue that powers your simulations.
            </p>
            <a
              href="/about"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-blue-200"
            >
              Learn more about traits
              <span aria-hidden="true">&rarr;</span>
            </a>
          </article>
        </div>
      </div>
    </section>
  );
};

export default PortalPage;
