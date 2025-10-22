import { FiArrowRight, FiPlay } from "react-icons/fi";
import AccentButton from "../common/AccentButton";
import Container from "../common/Container";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-border bg-gradient-to-br from-indigo-600/40 via-surface-elevated to-surface px-6 py-16 shadow-theme-card sm:px-12">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 rounded-l-[3rem] bg-indigo-500/20 blur-3xl lg:block" />
      <Container className="relative z-10 max-w-4xl px-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-accent">
          Zygotrix University
          <span className="text-muted">Future-forward learning</span>
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Learn the systems behind breakthrough products—with mentors who build
          them.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-muted">
          Join immersive programs combining cohort-based learning, adaptive
          practice MCQs, and the Simulation Studio for lifelike labs. Move
          beyond tutorials into applied mastery.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <AccentButton to="/courses" icon={<FiArrowRight />}>
            Browse Programs
          </AccentButton>
          <AccentButton to="/practice" variant="secondary" icon={<FiPlay />}>
            Enter Practice Studio
          </AccentButton>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { metric: "96%", label: "Learner satisfaction" },
            { metric: "40+", label: "Studio-inspired programs" },
            { metric: "12K", label: "Adaptive practice questions" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-border bg-surface p-5 text-center text-sm text-muted"
            >
              <p className="text-2xl font-semibold text-foreground">
                {item.metric}
              </p>
              <p className="mt-2 capitalize tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;
