import { FiTarget, FiCheckCircle, FiTrendingUp } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";
import LearningPathCard from "../components/cards/LearningPathCard";
import AccentButton from "../components/common/AccentButton";
import { learningPaths } from "../data/universityData";

const PathsPage = () => {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Learning Paths"
        title="Choose a journey engineered for career breakthroughs."
        description={
          <p>
            Each path blends flagship courses, mentor checkpoints, and adaptive practice playlists. Follow curated
            milestones to earn industry-recognized credentials while building a launch-ready portfolio.
          </p>
        }
        actions={<AccentButton to="/contact">Talk with an advisor</AccentButton>}
      />

      <Container className="space-y-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: <FiTarget />,
              title: "Milestone-based pacing",
              description: "Progress through design sprints, code reviews, and leadership clinics aligned to your goals.",
            },
            {
              icon: <FiCheckCircle />,
              title: "Mentor accountability",
              description: "Attend bi-weekly mentor sessions for project critiques and personalized feedback loops.",
            },
            {
              icon: <FiTrendingUp />,
              title: "Data-backed outcomes",
              description: "Dashboards track confidence, readiness, and hiring momentum across each path.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200"
            >
              <div className="flex items-center gap-3 text-indigo-200">
                <span className="text-lg">{item.icon}</span>
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">{item.title}</p>
              </div>
              <p className="mt-3 text-sm text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path) => (
            <LearningPathCard key={path.id} path={path} />
          ))}
        </div>
      </Container>
    </div>
  );
};

export default PathsPage;
