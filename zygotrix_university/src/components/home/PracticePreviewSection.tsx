import { FiCpu, FiLayers, FiBarChart2 } from "react-icons/fi";
import SectionHeading from "../common/SectionHeading";
import Container from "../common/Container";
import PracticeCard from "../cards/PracticeCard";
import type { PracticeTopic } from "../../types";

interface PracticePreviewSectionProps {
  topics: PracticeTopic[];
}

const PracticePreviewSection = ({ topics }: PracticePreviewSectionProps) => {
  return (
    <section className="pt-20">
      <Container className="px-0 sm:px-0">
        <div className="rounded-[2.5rem] border border-white/8 bg-gradient-to-br from-indigo-500/10 via-[#080c1c] to-slate-900 p-8 sm:p-12">
          <SectionHeading
            eyebrow="Practice Studio"
            title="Adaptive MCQs that mirror interview and on-the-job challenges."
            description="Simulation-powered feedback guides you toward mastery. Drill into skill gaps, compare progress with your team, and unlock advanced labs."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-6 sm:grid-cols-2">
              {topics.slice(0, 4).map((topic) => (
                <PracticeCard key={topic.id} topic={topic} />
              ))}
            </div>
            <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="space-y-6">
                {[
                  {
                    icon: <FiCpu />,
                    title: "AI-assisted feedback",
                    description:
                      "Receive tailored explanations, hints, and follow-up resources for every question.",
                  },
                  {
                    icon: <FiLayers />,
                    title: "Scenario branching",
                    description:
                      "Explore multiple solution paths and learn trade-offs through branching storylines.",
                  },
                  {
                    icon: <FiBarChart2 />,
                    title: "Team benchmarks",
                    description:
                      "Compare your readiness with teammates and receive curated practice playlists.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3 text-indigo-200">
                      <span className="text-lg">{item.icon}</span>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em]">
                        {item.title}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-3 text-xs text-indigo-100">
                Keep your streak alive — new question packs arrive every Monday, curated by our
                instructor council.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default PracticePreviewSection;
