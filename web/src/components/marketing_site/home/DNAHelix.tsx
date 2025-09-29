// DNA Helix Component
const DNAHelix: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 100 200" className="w-full h-full">
        <defs>
          <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>

        {/* DNA strands */}
        {[...Array(20)].map((_, i) => {
          const y = i * 10;
          const leftX = 30 + 15 * Math.sin((i * Math.PI) / 4);
          const rightX = 70 - 15 * Math.sin((i * Math.PI) / 4);

          return (
            <g
              key={i}
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Base pairs */}
              <line
                x1={leftX}
                y1={y}
                x2={rightX}
                y2={y}
                stroke="url(#dnaGradient)"
                strokeWidth="1"
                opacity="0.6"
              />
              {/* Left strand */}
              <circle cx={leftX} cy={y} r="2" fill="url(#dnaGradient)" />
              {/* Right strand */}
              <circle cx={rightX} cy={y} r="2" fill="url(#dnaGradient)" />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default DNAHelix;
