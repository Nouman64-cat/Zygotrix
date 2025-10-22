import { FiMail, FiClock, FiHelpCircle } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";
import FaqAccordion from "../components/shared/FaqAccordion";
import { faqs } from "../data/universityData";

const supportChannels = [
  {
    icon: <FiMail />,
    title: "Email",
    detail: "support@zygotrix.com",
    description: "Expect a reply within 12 business hours.",
  },
  {
    icon: <FiClock />,
    title: "Live chat",
    detail: "Weekdays • 9am – 6pm ET",
    description: "Connect with learner success advocates in minutes.",
  },
  {
    icon: <FiHelpCircle />,
    title: "Workshops",
    detail: "Monthly onboarding clinics",
    description:
      "Walk through platform setup and Simulation Studio best practices.",
  },
];

const SupportPage = () => {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Support"
        title="We’re here to help you stay on track."
        description={
          <p>
            Whether you’re joining a course or scaling learning across your
            team, our support crew can guide you through onboarding, billing,
            accessibility, and anything in between.
          </p>
        }
      />

      <Container className="space-y-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {supportChannels.map((channel) => (
            <div
              key={channel.title}
              className="rounded-3xl border border-border bg-surface shadow-theme-card p-6 text-sm"
            >
              <div className="flex items-center gap-3 text-accent">
                <span className="text-lg">{channel.icon}</span>
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">
                  {channel.title}
                </p>
              </div>
              <p className="mt-3 text-sm text-foreground">{channel.detail}</p>
              <p className="mt-2 text-sm text-muted">{channel.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[2.5rem] border border-border bg-surface shadow-theme-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-sm text-muted">
            Browse the top queries from learners and admins. Need more? Email us
            anytime.
          </p>
          <div className="mt-6">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default SupportPage;
