import { learnerProfile } from "../../../data/dashboardData";

const LearnerSnapshot = () => {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-indigo-500/20 via-[#0b1121] to-[#070b17] p-6">
      <div className="flex items-center gap-4">
        <img
          src={learnerProfile.avatar}
          alt={learnerProfile.name}
          className="h-14 w-14 rounded-full border border-white/10 object-cover"
          loading="lazy"
        />
        <div>
          <p className="text-sm font-semibold text-white">{learnerProfile.name}</p>
          <p className="text-xs text-indigo-100">{learnerProfile.role}</p>
        </div>
      </div>
      <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
        <p className="font-semibold uppercase tracking-[0.24em] text-indigo-200">Cohort</p>
        <p className="mt-1 text-sm text-white">{learnerProfile.cohort}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-200">Streak</p>
          <p className="mt-2 text-2xl font-semibold text-white">{learnerProfile.streak} days</p>
        </div>
        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-200">XP</p>
          <p className="mt-2 text-2xl font-semibold text-white">{learnerProfile.xp}</p>
        </div>
        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-200">Next badge</p>
          <p className="mt-2 text-sm font-semibold text-white">{learnerProfile.nextBadge}</p>
        </div>
      </div>
    </div>
  );
};

export default LearnerSnapshot;
