import { FiMessageCircle, FiUserPlus, FiVideo } from "react-icons/fi";
import AccentButton from "../../components/common/AccentButton";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

const communityThreads = [
  {
    id: "thread-1",
    title: "How is your team applying responsible AI frameworks?",
    replies: 32,
    lastActivity: "2h ago",
    tag: "AI Strategy",
  },
  {
    id: "thread-2",
    title: "Share your Simulation Studio debrief templates",
    replies: 18,
    lastActivity: "5h ago",
    tag: "Simulation Studio",
  },
  {
    id: "thread-3",
    title: "Design system tokens for multi-brand ecosystems",
    replies: 27,
    lastActivity: "1d ago",
    tag: "Design Systems",
  },
];

const CommunityDashboardPage = () => {
  const { summary } = useDashboardSummary();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-surface p-6 transition-colors md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-subtle px-3 py-1 text-xs text-accent transition-colors">
            <FiMessageCircle /> Community hub
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            Stay plugged into your cohort
          </h2>
          <p className="text-sm text-muted">
            Join live sessions, collaborate in threads, and pair up with accountability partners to ship faster.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AccentButton to="/community" icon={<FiVideo />}>
            Join live session
          </AccentButton>
          <AccentButton to="/contact" variant="secondary" icon={<FiUserPlus />}>
            Find partner
          </AccentButton>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors">
        <h3 className="text-lg font-semibold text-foreground">Upcoming community events</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {(summary?.schedule ?? []).slice(0, 3).map((event) => {
            const startDate = event.start ? new Date(event.start) : null;
            return (
              <div
                key={event.id}
                className="rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 text-sm text-muted transition-colors"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  {startDate
                    ? startDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    : "TBA"}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{event.title}</p>
                <p className="text-xs text-muted">
                  {startDate
                    ? startDate.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
              </div>
            );
          })}
          {(!summary || summary.schedule.length === 0) && (
            <p className="col-span-full text-sm text-muted">
              Upcoming live sessions will appear here once scheduled.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors">
        <h3 className="text-lg font-semibold text-foreground">Active threads</h3>
        <div className="mt-4 space-y-4">
          {communityThreads.map((thread) => (
            <div
              key={thread.id}
              className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{thread.title}</p>
                <p className="text-xs text-muted">
                  {thread.replies} replies • Updated {thread.lastActivity}
                </p>
              </div>
              <span className="rounded-full border border-border bg-background-subtle px-3 py-1 text-xs uppercase tracking-[0.24em] text-accent transition-colors">
                {thread.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityDashboardPage;
