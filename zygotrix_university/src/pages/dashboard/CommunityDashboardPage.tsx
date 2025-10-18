import { FiMessageCircle, FiUserPlus, FiVideo } from "react-icons/fi";
import AccentButton from "../../components/common/AccentButton";
import { learningSchedule } from "../../data/dashboardData";

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
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/7 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-200">
            <FiMessageCircle /> Community hub
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-white">Stay plugged into your cohort</h2>
          <p className="text-sm text-slate-300">
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

      <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
        <h3 className="text-lg font-semibold text-white">Upcoming community events</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {learningSchedule.map((event) => (
            <div
              key={event.id}
              className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
                {new Date(event.start).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{event.title}</p>
              <p className="text-xs text-indigo-100">
                {new Date(event.start).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
        <h3 className="text-lg font-semibold text-white">Active threads</h3>
        <div className="mt-4 space-y-4">
          {communityThreads.map((thread) => (
            <div
              key={thread.id}
              className="flex flex-col gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-white">{thread.title}</p>
                <p className="text-xs text-indigo-100">
                  {thread.replies} replies • Updated {thread.lastActivity}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-indigo-200">
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
