import { FiMessageCircle } from "react-icons/fi";
import AccentButton from "../common/AccentButton";
import Container from "../common/Container";

const CallToActionSection = () => {
  return (
    <section className="pt-24">
      <Container className="px-0 sm:px-0">
        <div className="overflow-hidden rounded-[2.5rem] border border-indigo-400/30 bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-blue-500/30 px-8 py-12 sm:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-indigo-200">
                <FiMessageCircle />
                Weekly mentor circles
              </span>
              <h3 className="text-3xl font-semibold tracking-tight text-white">
                Join a global community learning the frontier of product innovation.
              </h3>
              <p className="text-sm text-indigo-100">
                Access exclusive workshops, design critiques, and engineering roundtables hosted by
                practitioners actively shipping at scale.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <AccentButton to="/community">Jump into Community</AccentButton>
              <AccentButton to="/contact" variant="secondary">
                Talk to a learning advisor
              </AccentButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default CallToActionSection;
