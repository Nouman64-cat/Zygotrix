import { FiBookOpen, FiDownloadCloud, FiMic, FiFileText } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";
import AccentButton from "../components/common/AccentButton";

const resourceCollections = [
  {
    title: "Playbooks",
    icon: <FiBookOpen />,
    description: "Actionable guides that walk through discovery sprints, service blueprints, and AI readiness audits.",
    cta: "Read playbooks",
  },
  {
    title: "Templates",
    icon: <FiDownloadCloud />,
    description: "Download workshop canvases, engineering scorecards, and stakeholder brief templates.",
    cta: "Get templates",
  },
  {
    title: "Podcasts",
    icon: <FiMic />,
    description: "Listen to conversations with product leaders building across AI, design systems, and cloud ops.",
    cta: "Listen in",
  },
  {
    title: "Case studies",
    icon: <FiFileText />,
    description: "See how teams leverage Zygotrix University to accelerate launches and drive measurable outcomes.",
    cta: "Explore stories",
  },
];

const ResourcesPage = () => {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Resource Library"
        title="Stay in the loop with curated insights from practitioners."
        description={
          <p>
            Access research-backed playbooks, templates, and interviews that complement your learning. New drops arrive
            every Thursday—subscribe to get updates.
          </p>
        }
        actions={<AccentButton to="/newsletter">Subscribe</AccentButton>}
      />

      <Container className="space-y-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {resourceCollections.map((collection) => (
            <div
              key={collection.title}
              className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/8 to-white/5 p-6 text-sm text-slate-200"
            >
              <div className="flex items-center gap-3 text-indigo-200">
                <span className="text-lg">{collection.icon}</span>
                <p className="text-sm font-semibold uppercase tracking-[0.28em]">
                  {collection.title}
                </p>
              </div>
              <p className="mt-3 text-sm text-slate-300">{collection.description}</p>
              <AccentButton variant="ghost" className="mt-5 text-indigo-200">
                {collection.cta}
              </AccentButton>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5 border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
                Featured article
              </span>
              <h2 className="text-2xl font-semibold text-white">
                How Simulation Studio Helps Teams Stress-Test Launch Readiness
              </h2>
              <p className="text-sm text-slate-300">
                Learn the five-step playbook to rehearse launches, evaluate failure scenarios, and align stakeholders on
                the risk matrix before going live.
              </p>
              <AccentButton variant="secondary">Read feature</AccentButton>
            </div>
            <div className="space-y-4 bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent p-8">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
                Newsletter picks
              </span>
              <ul className="space-y-4 text-sm text-slate-200">
                <li>• Interview: Building ethical AI checkpoints with cross-functional teams.</li>
                <li>• Toolkit: Figma token strategies for enterprise-grade design systems.</li>
                <li>• Lab recap: Observability war room inside Simulation Studio.</li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ResourcesPage;
