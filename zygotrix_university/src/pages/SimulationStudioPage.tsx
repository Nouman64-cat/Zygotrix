import { FiAperture, FiCpu, FiGitBranch, FiShield } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";
import AccentButton from "../components/common/AccentButton";

const missionStages = [
  {
    title: "Discover",
    description: "Kickoff with scenario briefs rooted in real organizational constraints and stakeholder priorities.",
  },
  {
    title: "Design",
    description: "Map decisions, trade-offs, and system diagrams inside collaborative workspace templates.",
  },
  {
    title: "Simulate",
    description: "Run branching simulations with live telemetry, metrics dashboards, and guided mentor prompts.",
  },
  {
    title: "Debrief",
    description: "Receive evidence-based feedback, replay key decisions, and export a summary for portfolio use.",
  },
];

const SimulationStudioPage = () => {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Simulation Studio"
        title="Rehearse real-world launches in a safe, mentor-guided playground."
        description={
          <p>
            The Simulation Studio combines scenario authoring, adaptive branching, and AI-assisted mentoring. Practice
            critical moves before they matter—then bring the playbooks back to your team.
          </p>
        }
        actions={
          <>
            <AccentButton to="/practice">Try a practice mission</AccentButton>
            <AccentButton to="/enterprise" variant="secondary">
              Request enterprise demo
            </AccentButton>
          </>
        }
      />

      <Container className="space-y-12">
        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
          <div className="grid gap-6 md:grid-cols-4">
            {missionStages.map((stage) => (
              <div key={stage.title} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
                  {stage.title}
                </span>
                <p className="mt-3 text-sm text-slate-300">{stage.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {[
            {
              icon: <FiAperture />,
              title: "Branching scenarios",
              description:
                "Choose between multiple narrative paths and see consequences ripple across stakeholders, systems, and KPIs.",
            },
            {
              icon: <FiCpu />,
              title: "AI mentor assist",
              description:
                "Receive contextual nudges, insights, and hint cards generated from mentor-crafted rubrics and best practices.",
            },
            {
              icon: <FiGitBranch />,
              title: "Versioned playbacks",
              description:
                "Replay mission timelines, annotate decision points, and share learning reels with your squad.",
            },
            {
              icon: <FiShield />,
              title: "Governance ready",
              description:
                "Built-in guardrails ensure simulations stay aligned with compliance, privacy, and ethical guidelines.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-500/15 via-transparent to-transparent p-6 text-sm text-slate-200"
            >
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
      </Container>
    </div>
  );
};

export default SimulationStudioPage;
