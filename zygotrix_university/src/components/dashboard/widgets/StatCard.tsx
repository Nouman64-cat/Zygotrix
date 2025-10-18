import { cn } from "../../../utils/cn";
import type { AnalyticsStat } from "../../../types";

interface StatCardProps {
  stat: AnalyticsStat;
}

const StatCard = ({ stat }: StatCardProps) => {
  const changePositive = stat.change >= 0;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 transition hover:border-indigo-400/40">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
        {stat.label}
      </p>
      <div className="mt-3 flex items-end gap-3">
        <span className="text-3xl font-semibold text-white">{stat.value}</span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            changePositive ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300",
          )}
        >
          {changePositive ? "+" : ""}
          {stat.change}%
        </span>
      </div>
      <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">{stat.timeframe}</p>
    </div>
  );
};

export default StatCard;
