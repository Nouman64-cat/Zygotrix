// Interactive DNA Strand Component with ATCG Base Pairs
const DNAStrand: React.FC = () => {
  // Helper function to get gradient ID for bases
  const getBaseGradientId = (base: string): string => {
    switch (base) {
      case "A":
        return "adenineGradient";
      case "T":
        return "thymineGradient";
      case "G":
        return "guanineGradient";
      case "C":
        return "cytosineGradient";
      default:
        return "adenineGradient";
    }
  };

  // Generate base pairs (A-T, G-C complementary pairs) with unique IDs
  const basePairs = [
    { id: "bp-1", left: "A", right: "T", color: "#EF4444" }, // Red for A-T
    { id: "bp-2", left: "G", right: "C", color: "#3B82F6" }, // Blue for G-C
    { id: "bp-3", left: "T", right: "A", color: "#EF4444" }, // Red for T-A
    { id: "bp-4", left: "C", right: "G", color: "#3B82F6" }, // Blue for C-G
    { id: "bp-5", left: "A", right: "T", color: "#EF4444" },
    { id: "bp-6", left: "G", right: "C", color: "#3B82F6" },
    { id: "bp-7", left: "C", right: "G", color: "#3B82F6" },
    { id: "bp-8", left: "T", right: "A", color: "#EF4444" },
    { id: "bp-9", left: "A", right: "T", color: "#EF4444" },
    { id: "bp-10", left: "G", right: "C", color: "#3B82F6" },
    { id: "bp-11", left: "T", right: "A", color: "#EF4444" },
    { id: "bp-12", left: "C", right: "G", color: "#3B82F6" },
    { id: "bp-13", left: "A", right: "T", color: "#EF4444" },
    { id: "bp-14", left: "G", right: "C", color: "#3B82F6" },
    { id: "bp-15", left: "T", right: "A", color: "#EF4444" },
  ];

  return (
    <div className="relative w-full max-w-2xl h-[700px] mx-auto">
      {/* 3D DNA Double Helix Structure */}
      <div className="relative w-full h-full flex items-center justify-center">
        <svg
          viewBox="0 0 300 500"
          className="w-full h-full animate-spin-slow"
          style={{ transformStyle: "preserve-3d" }}
        >
          <defs>
            <linearGradient
              id="backboneGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            <linearGradient
              id="adenineGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>

            <linearGradient
              id="thymineGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>

            <linearGradient
              id="guanineGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            <linearGradient
              id="cytosineGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Draw the DNA double helix with proper 3D structure */}
          {basePairs.map((pair, i) => {
            const angle = (i * Math.PI) / 4; // 45 degrees per step
            const y = i * 25 + 50; // Vertical spacing

            // Calculate 3D positions for the helix
            const leftX = 100 + 50 * Math.cos(angle);
            const rightX = 200 - 50 * Math.cos(angle);
            const leftZ = 50 * Math.sin(angle);
            const rightZ = -50 * Math.sin(angle);

            // Depth-based opacity and size for 3D effect
            const leftOpacity = (leftZ + 50) / 100;
            const rightOpacity = (rightZ + 50) / 100;
            const leftScale = 0.5 + leftOpacity * 0.5;
            const rightScale = 0.5 + rightOpacity * 0.5;

            return (
              <g
                key={pair.id}
                className="animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Base Pair Connection (Hydrogen Bonds) */}
                <line
                  x1={leftX}
                  y1={y}
                  x2={rightX}
                  y2={y}
                  stroke={pair.color}
                  strokeWidth="2"
                  opacity="0.6"
                  strokeDasharray={
                    pair.left === "A" || pair.left === "T"
                      ? "5,3"
                      : "3,2,3,2,3,3"
                  }
                  filter="url(#glow)"
                />

                {/* Left Base */}
                <g transform={`translate(${leftX}, ${y}) scale(${leftScale})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill={`url(#${getBaseGradientId(pair.left)})`}
                    opacity={leftOpacity}
                    filter="url(#glow)"
                  />
                  <text
                    x="0"
                    y="6"
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    opacity={leftOpacity}
                  >
                    {pair.left}
                  </text>
                </g>

                {/* Right Base */}
                <g
                  transform={`translate(${rightX}, ${y}) scale(${rightScale})`}
                >
                  <circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill={`url(#${getBaseGradientId(pair.right)})`}
                    opacity={rightOpacity}
                    filter="url(#glow)"
                  />
                  <text
                    x="0"
                    y="6"
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    opacity={rightOpacity}
                  >
                    {pair.right}
                  </text>
                </g>

                {/* Backbone connections */}
                {i > 0 && (
                  <>
                    {/* Left backbone */}
                    <line
                      x1={100 + 50 * Math.cos(((i - 1) * Math.PI) / 4)}
                      y1={(i - 1) * 25 + 50}
                      x2={leftX}
                      y2={y}
                      stroke="url(#backboneGradient)"
                      strokeWidth="4"
                      opacity={leftOpacity * 0.8}
                      filter="url(#glow)"
                    />
                    {/* Right backbone */}
                    <line
                      x1={200 - 50 * Math.cos(((i - 1) * Math.PI) / 4)}
                      y1={(i - 1) * 25 + 50}
                      x2={rightX}
                      y2={y}
                      stroke="url(#backboneGradient)"
                      strokeWidth="4"
                      opacity={rightOpacity * 0.8}
                      filter="url(#glow)"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default DNAStrand;
