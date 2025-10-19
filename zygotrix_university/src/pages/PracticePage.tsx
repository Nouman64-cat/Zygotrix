import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { FiAward, FiCompass, FiZap } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";
import PracticeCard from "../components/cards/PracticeCard";
import AccentButton from "../components/common/AccentButton";
import { usePracticeSets } from "../hooks/usePracticeSets";

const PracticePage = () => {
  const { practiceSets, loading } = usePracticeSets();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeSet = params.get("set");

  const orderedSets = useMemo(() => {
    if (!activeSet) {
      return practiceSets;
    }
    const sorted = [...practiceSets];
    sorted.sort((a, b) => {
      if (a.slug === activeSet || a.id === activeSet) return -1;
      if (b.slug === activeSet || b.id === activeSet) return 1;
      return 0;
    });
    return sorted;
  }, [practiceSets, activeSet]);

  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Practice Studio"
        title="Sharpen your skills with adaptive MCQs and branching scenarios."
        description={
          <p>
            The Practice Studio personalizes question difficulty, explains answers with depth, and recommends follow-up
            labs. Track accuracy trends over time and compare performance with peers.
          </p>
        }
        actions={
          <>
            <AccentButton to="/courses">Pair with a course</AccentButton>
            <AccentButton to="/community" variant="secondary">
              Join leaderboard
            </AccentButton>
          </>
        }
      />

      <Container className="space-y-12">
        <div className="grid gap-6 md:grid-cols-2">
          {loading && practiceSets.length === 0
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                />
              ))
            : orderedSets.map((topic) => (
                <PracticeCard
                  key={topic.id}
                  topic={topic}
                  highlighted={activeSet === topic.slug || activeSet === topic.id}
                />
              ))}
        </div>

        <div className="grid gap-6 rounded-[2.5rem] border border-white/10 bg-white/5 p-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            {[FiZap, FiCompass, FiAward].map((Icon, index) => {
              const features = [
                {
                  title: "Adaptive difficulty engine",
                  description:
                    "Our AI calibrates question complexity after every attempt, ensuring you stay in the optimal learning zone.",
                },
                {
                  title: "Scenario-rich explanations",
                  description:
                    "Review in-depth breakdowns with system diagrams, code snippets, and real-world best practices from mentors.",
                },
                {
                  title: "Certifications ready",
                  description:
                    "Track exam readiness with badges that align to AWS, Microsoft, and UX industry certifications.",
                },
              ];

              const feature = features[index];

              return (
                <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-3 text-indigo-200">
                    <Icon />
                    <p className="text-sm font-semibold uppercase tracking-[0.2em]">
                      {feature.title}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col justify-between rounded-3xl border border-indigo-400/30 bg-gradient-to-b from-indigo-500/20 via-indigo-500/10 to-transparent p-6">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Weekly leaderboards and streaks
              </h3>
              <p className="mt-3 text-sm text-indigo-100">
                Join your cohort in friendly competition. Earn streak boosts, unlock surprise labs, and showcase momentum
                in community circles.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 px-4 py-6 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">This week’s highlight</span>
                <span className="text-xs text-indigo-100">Mastery unlock</span>
              </div>
              <p className="mt-2 text-xs text-slate-300">
                Complete three Simulation Studio practice missions to unlock advanced labs curated by mentors.
              </p>
            </div>
            <AccentButton to="/simulation-studio" className="mt-6">
              Explore Simulation Missions
            </AccentButton>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PracticePage;
