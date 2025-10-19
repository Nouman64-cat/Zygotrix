import type { LearnerProfile } from "../../../types";

interface LearnerSnapshotProps {
  profile: LearnerProfile;
}

const LearnerSnapshot = ({ profile }: LearnerSnapshotProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-dashboard-highlight p-6 shadow-theme-card transition-colors">
      <div className="flex items-center gap-4">
        <img
          src={
            profile.avatar ??
            "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60"
          }
          alt={profile.name}
          className="h-14 w-14 rounded-full border border-border object-cover"
          loading="lazy"
        />
        <div>
          <p className="text-sm font-semibold text-foreground">{profile.name}</p>
          {profile.role && <p className="text-xs text-muted">{profile.role}</p>}
        </div>
      </div>
      <div className="rounded-[1.25rem] border border-border bg-surface px-4 py-3 text-xs text-muted transition-colors">
        <p className="font-semibold uppercase tracking-[0.24em] text-accent">Cohort</p>
        <p className="mt-1 text-sm text-foreground">{profile.cohort ?? "—"}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.25rem] border border-border bg-surface px-4 py-3 transition-colors">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Streak</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {profile.streak ?? 0} days
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-border bg-surface px-4 py-3 transition-colors">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">XP</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {profile.xp ?? 0}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-border bg-surface px-4 py-3 transition-colors">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Next badge</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {profile.nextBadge ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearnerSnapshot;
