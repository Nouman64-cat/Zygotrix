import { FiCheck, FiEye, FiHeadphones, FiType } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";

const AccessibilityPage = () => {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Accessibility"
        title="Learning that adapts to every body and brain."
        description={
          <p>
            We design experiences using WCAG 2.2 AA guidelines and collaborate
            with learners to remove friction. If you need accommodations, we’ll
            make it happen.
          </p>
        }
      />

      <Container className="space-y-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <FiEye />,
              title: "Visual",
              description:
                "High-contrast themes, font scaling, and keyboard navigation.",
            },
            {
              icon: <FiHeadphones />,
              title: "Audio",
              description: "Live captions, transcripts, and descriptive audio.",
            },
            {
              icon: <FiType />,
              title: "Cognitive",
              description:
                "Chunked content, plain-language summaries, flexible pacing.",
            },
            {
              icon: <FiCheck />,
              title: "Assistance",
              description:
                "Dedicated coordinator to implement custom accommodations.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-border bg-surface shadow-theme-card p-6 text-sm text-muted"
            >
              <div className="flex items-center gap-3 text-accent">
                <span className="text-lg">{item.icon}</span>
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">
                  {item.title}
                </p>
              </div>
              <p className="mt-3 text-sm text-muted">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[2.5rem] border border-border bg-surface shadow-theme-card p-8 text-sm text-muted">
          <h2 className="text-2xl font-semibold text-foreground">
            Need something specific?
          </h2>
          <p className="mt-3 text-sm text-muted">
            Email accessibility@zygotrix.com and we'll collaborate on a plan. We
            can adjust Simulation Studio controls, mail printed materials, or
            provide alternative assessment formats upon request.
          </p>
        </div>
      </Container>
    </div>
  );
};

export default AccessibilityPage;
