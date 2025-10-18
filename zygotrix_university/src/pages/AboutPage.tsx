import { FiHeart, FiCompass, FiLayers } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";

const values = [
  {
    icon: <FiHeart />,
    title: "Human-centered",
    description: "We design learning experiences that respect your time, context, and motivations.",
  },
  {
    icon: <FiCompass />,
    title: "Outcome-driven",
    description: "Every course is mapped backward from real product, design, and engineering milestones.",
  },
  {
    icon: <FiLayers />,
    title: "Systems-thinking",
    description: "We help you connect cross-functional dots so your solutions scale with clarity.",
  },
];

const AboutPage = () => {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="About"
        title="A new way to upskill—purpose built for modern product teams."
        description={
          <p>
            Zygotrix University brings together practitioners from AI, design, and cloud engineering to craft experiences
            that translate knowledge into action. We combine rigorous curriculum with community, mentorship, and
            simulations so learning sticks.
          </p>
        }
      />

      <Container className="space-y-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200"
            >
              <div className="flex items-center gap-3 text-indigo-200">
                <span className="text-lg">{value.icon}</span>
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">
                  {value.title}
                </p>
              </div>
              <p className="mt-3 text-sm text-slate-300">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-white/5 p-8 sm:p-12">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
                Our origin
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Born inside an innovation lab, now serving builders worldwide.
              </h2>
              <p className="text-sm text-slate-200">
                We started as an internal academy to upskill engineers, designers, and PMs shipping complex AI products.
                Word spread, and our curriculum evolved into an open platform for teams everywhere.
              </p>
            </div>
            <div className="space-y-3 text-sm text-indigo-100">
              <p>• 48K+ learners spanning startups, enterprises, and consultancies.</p>
              <p>• 320+ projects and simulations reviewed by active practitioners.</p>
              <p>• Partnerships with CourFactory, Orbit Labs, Nebula Systems, and more.</p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AboutPage;
