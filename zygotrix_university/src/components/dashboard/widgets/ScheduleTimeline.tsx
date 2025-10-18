import { FiCalendar, FiClock, FiRadio, FiZap } from "react-icons/fi";
import type { LearningEvent } from "../../../types";
import { cn } from "../../../utils/cn";

interface ScheduleTimelineProps {
  events: LearningEvent[];
}

const iconMap: Record<LearningEvent["type"], typeof FiRadio> = {
  live: FiRadio,
  async: FiClock,
  deadline: FiCalendar,
};

const badgeStyles: Record<LearningEvent["type"], string> = {
  live: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  async: "bg-blue-500/15 text-blue-200 border-blue-500/30",
  deadline: "bg-rose-500/15 text-rose-200 border-rose-500/30",
};

const ScheduleTimeline = ({ events }: ScheduleTimelineProps) => {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">This week</h3>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
          <FiZap /> 3 planned
        </span>
      </div>
      <ol className="mt-5 space-y-5">
        {events.map((event) => (
          <li key={event.id} className="relative pl-6">
            <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400" />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">{event.title}</p>
                <p className="text-xs text-slate-300">{new Date(event.start).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
              </div>
              {(() => {
                const Icon = iconMap[event.type];
                return (
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]",
                      badgeStyles[event.type],
                    )}
                  >
                    <Icon />
                    {event.type}
                  </span>
                );
              })()}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ScheduleTimeline;
