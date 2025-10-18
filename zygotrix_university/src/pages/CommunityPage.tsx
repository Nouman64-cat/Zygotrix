import { FiUsers, FiVideo, FiMessageCircle, FiCalendar } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";
import AccentButton from "../components/common/AccentButton";

const communityHighlights = [
  {
    icon: <FiUsers />,
    title: "Global cohorts",
    description: "Connect with product builders across 92 countries in curated cohorts aligned by skill level.",
  },
  {
    icon: <FiVideo />,
    title: "Live sessions",
    description: "Attend weekly live critiques, code walkthroughs, and design showcases hosted by industry mentors.",
  },
  {
    icon: <FiMessageCircle />,
    title: "Peer circles",
    description: "Join themed peer circles to practice interviews, review portfolios, and share launch retrospectives.",
  },
];

const upcomingEvents = [
  {
    title: "AI Product Strategy Roundtable",
    date: "Jan 22",
    host: "Dr. Hannah Lee",
    description: "Learn how teams at scale evaluate model ROI and ethical considerations before shipping.",
  },
  {
    title: "Design Systems Clinic",
    date: "Jan 29",
    host: "Emily Jones",
    description: "Submit components for live critique and see how enterprise teams evolve design languages.",
  },
  {
    title: "Cloud Resilience Red-Team",
    date: "Feb 05",
    host: "Miguel Garcia",
    description: "Run chaos experiments in the Simulation Studio to stress-test your observability stack.",
  },
];

const CommunityPage = () => {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Community"
        title="Learn in public, build together, and stay accountable."
        description={
          <p>
            Zygotrix Community is where learning sticks. Participate in live events, share progress updates, and receive
            directional feedback from peers and mentors to keep momentum high.
          </p>
        }
        actions={<AccentButton to="/contact">Join waitlist</AccentButton>}
      />

      <Container className="space-y-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {communityHighlights.map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm">
              <div className="flex items-center gap-3 text-indigo-200">
                <span className="text-lg">{item.icon}</span>
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">{item.title}</p>
              </div>
              <p className="mt-3 text-sm text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5">
          <div className="border-b border-white/10 bg-white/5 px-6 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-indigo-200">
              <FiCalendar />
              Upcoming sessions
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {upcomingEvents.map((event) => (
              <div key={event.title} className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
                    {event.date}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{event.title}</h3>
                  <p className="text-sm text-indigo-100">{event.description}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
                    Host
                  </span>
                  <p className="text-sm text-white">{event.host}</p>
                  <AccentButton variant="secondary">Reserve spot</AccentButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CommunityPage;
