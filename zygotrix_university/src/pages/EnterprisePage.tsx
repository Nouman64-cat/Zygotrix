import { FiTrendingUp, FiShield, FiLayers } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";
import AccentButton from "../components/common/AccentButton";

const EnterprisePage = () => {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Enterprises"
        title="Upskill entire product organizations with measurable impact."
        description={
          <p>
            Zygotrix for Teams pairs our flagship curriculum with analytics, enablement resources, and co-branded
            Simulation Studio missions designed for enterprise rollouts.
          </p>
        }
        actions={<AccentButton to="/contact">Book enterprise tour</AccentButton>}
      />

      <Container className="space-y-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: <FiTrendingUp />,
              title: "Skill analytics",
              description: "Monitor cohort readiness, practice streaks, and capability shifts across org charts.",
            },
            {
              icon: <FiShield />,
              title: "Governance-ready",
              description: "SAML SSO, SOC 2 Type II controls, and granular permissions keep data secure.",
            },
            {
              icon: <FiLayers />,
              title: "Tailored missions",
              description: "Co-create Simulation Studio missions that mirror your product stack and roadmap.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
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

        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent p-8 sm:p-12">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
                Team enablement
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Launch playbooks tailored for your product org.
              </h2>
              <p className="text-sm text-slate-200">
                Our enablement coaches partner with your leads to align curriculum, set success metrics, and run
                readiness checkpoints before major launches.
              </p>
            </div>
            <div className="space-y-3 text-sm text-indigo-100">
              <p>• Dedicated success manager and quarterly strategy reviews.</p>
              <p>• Integrations with Slack, Microsoft Teams, and Workday Learning.</p>
              <p>• Flexible billing with seats, unlimited cohorts, or credential-based pricing.</p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default EnterprisePage;
