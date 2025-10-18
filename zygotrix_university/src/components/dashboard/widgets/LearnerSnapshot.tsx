import type { LearnerProfile } from "../../../types";

interface LearnerSnapshotProps {
  profile: LearnerProfile;
}

const LearnerSnapshot = ({ profile }: LearnerSnapshotProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-indigo-500/20 via-[#0b1121] to-[#070b17] p-6">
      <div className="flex items-center gap-4">
        <img
          src={
            profile.avatar ??
            "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60"
          }
          alt={profile.name}
          className="h-14 w-14 rounded-full border border-white/10 object-cover"
          loading="lazy"
        />
        <div>
          <p className="text-sm font-semibold text-white">{profile.name}</p>
          {profile.role && <p className="text-xs text-indigo-100">{profile.role}</p>}
        </div>
      </div>
      <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
        <p className="font-semibold uppercase tracking-[0.24em] text-indigo-200">Cohort</p>
        <p className="mt-1 text-sm text-white">{profile.cohort ?? "—"}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-200">Streak</p>
          <p className="mt-2 text-2xl font-semibold text-white">{profile.streak ?? 0} days</p>
        </div>
        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-200">XP</p>
          <p className="mt-2 text-2xl font-semibold text-white">{profile.xp ?? 0}</p>
        </div>
        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-200">Next badge</p>
          <p className="mt-2 text-sm font-semibold text-white">{profile.nextBadge ?? "—"}</p>
        </div>
      </div>
    </div>
  );
};

export default LearnerSnapshot;
