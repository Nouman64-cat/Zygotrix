import React from "react";

type PolygenicOverviewProps = {
  score: number | null;
  loading: boolean;
  error: string | null;
};

const PolygenicOverview: React.FC<PolygenicOverviewProps> = ({
  score,
  loading,
}) => {
  const width = Math.min(Math.max((score ?? 0) * 50 || 0, 0), 100);

  return (
    <div className="rounded-3xl bg-[#1E3A8A] p-6 text-white shadow-xl shadow-[#1E3A8A]/40">
      <p className="text-xs uppercase tracking-[0.35em] text-[#A5B4FC]">
        Polygenic signal
      </p>
      <p className="mt-2 text-2xl font-semibold">
        Expected score{" "}
        {loading ? "..." : score !== null ? score.toFixed(2) : "N/A"}
      </p>
      <div className="mt-6 flex items-center gap-4">
        <div className="h-3 w-3 rounded-full bg-[#FBBF24]" />
        <div className="flex h-3 flex-1 items-center overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-[#FBBF24]" style={{ width: `${width}%` }} />
        </div>
      </div>
    </div>
  );
};

export default PolygenicOverview;
