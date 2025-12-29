import React, { useState, useEffect } from 'react';

interface RnaStrandProps {
  sequence: string;
  className?: string;
  showCodons?: boolean;
}

/**
 * mRNA Single Strand Visualization Component with animation
 * Displays mRNA sequence as an animated single strand with wave motion
 */
const RnaStrand: React.FC<RnaStrandProps> = ({
  sequence,
  className = '',
  showCodons: _showCodons = true
}) => {
  const [animationTime, setAnimationTime] = useState(0);

  // Update animation time for smooth movement
  useEffect(() => {
    let animationId: number;

    const updateAnimation = () => {
      setAnimationTime(Date.now() * 0.001);
      animationId = requestAnimationFrame(updateAnimation);
    };

    updateAnimation();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Helper function to get gradient ID for mRNA bases
  const getBaseGradientId = (base: string): string => {
    switch (base.toUpperCase()) {
      case 'A':
        return 'mrna-adenineGradient';
      case 'U':
        return 'mrna-uracilGradient';
      case 'G':
        return 'mrna-guanineGradient';
      case 'C':
        return 'mrna-cytosineGradient';
      default:
        return 'mrna-adenineGradient';
    }
  };

  // Convert DNA sequence to mRNA (T -> U)
  const convertToMrna = (dnaSequence: string): string => {
    return dnaSequence
      .toUpperCase()
      .replace(/T/g, 'U')
      .replace(/\s/g, '');
  };

  // Parse sequence into bases
  const parseSequence = (): Array<{
    id: string;
    base: string;
    color: string;
  }> => {
    if (!sequence || sequence.trim().length === 0) {
      // Return default sequence if empty
      return [
        { id: 'mrna-default-1', base: 'A', color: '#FBBF24' },
        { id: 'mrna-default-2', base: 'U', color: '#F97316' },
        { id: 'mrna-default-3', base: 'G', color: '#8B5CF6' },
        { id: 'mrna-default-4', base: 'C', color: '#06B6D4' },
      ];
    }

    const mrnaSeq = convertToMrna(sequence);
    const bases = [];

    for (let i = 0; i < mrnaSeq.length; i++) {
      const base = mrnaSeq[i];
      let color = '#6B7280'; // Gray for unknown

      switch (base) {
        case 'A':
          color = '#FBBF24'; // Yellow/Amber
          break;
        case 'U':
          color = '#F97316'; // Orange
          break;
        case 'G':
          color = '#8B5CF6'; // Purple
          break;
        case 'C':
          color = '#06B6D4'; // Cyan
          break;
      }

      bases.push({
        id: `mrna-${i}`,
        base,
        color,
      });
    }

    return bases;
  };

  const bases = parseSequence();

  // Calculate dynamic height based on number of bases
  const dynamicHeight = Math.max(400, bases.length * 32 + 100);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Subtle background glow effect - orange tint for mRNA */}
      <div className="absolute inset-0 bg-gradient-radial from-orange-500/8 via-amber-500/3 to-transparent rounded-full blur-xl" />

      {/* Vertical mRNA Single Strand Structure */}
      <div className="relative w-full flex items-center justify-center">
        <svg
          viewBox={`0 0 200 ${dynamicHeight}`}
          className="w-full"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.4))',
            height: `${dynamicHeight}px`,
          }}
        >
          <g>
            <defs>
              {/* Backbone gradient for mRNA - orange/amber theme */}
              <linearGradient
                id="mrna-backboneGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#EA580C" stopOpacity="0.8" />
                <stop offset="30%" stopColor="#F97316" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#FB923C" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FDBA74" stopOpacity="0.8" />
              </linearGradient>

              {/* Base gradients */}
              <radialGradient id="mrna-adenineGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF3C7" />
                <stop offset="30%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" />
              </radialGradient>

              <radialGradient id="mrna-uracilGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFEDD5" />
                <stop offset="30%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </radialGradient>

              <radialGradient id="mrna-guanineGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E0E7FF" />
                <stop offset="30%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#7C3AED" />
              </radialGradient>

              <radialGradient id="mrna-cytosineGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#CFFAFE" />
                <stop offset="30%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0891B2" />
              </radialGradient>

              {/* Glow effect */}
              <filter id="mrna-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Shadow effect */}
              <filter id="mrna-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow
                  dx="1"
                  dy="1"
                  stdDeviation="1"
                  floodOpacity="0.4"
                />
              </filter>
            </defs>

            {/* FIRST PASS: Draw backbone (behind everything) */}
            {bases.map((base, i) => {
              if (i === 0) return null;

              const y = i * 32 + 50;
              const prevY = (i - 1) * 32 + 50;

              // Single strand wave animation
              const waveOffset = Math.sin(animationTime + i * 0.4) * 15;
              const prevWaveOffset = Math.sin(animationTime + (i - 1) * 0.4) * 15;

              const x = 100 + waveOffset;
              const prevX = 100 + prevWaveOffset;

              // Calculate opacity based on wave for 3D effect
              const zDepth = Math.sin(animationTime + i * 0.4);
              const opacity = 0.7 + zDepth * 0.3;

              // Offset to stop at circle edge
              const circleOffset = 13;
              const dx = x - prevX;
              const dy = y - prevY;
              const len = Math.sqrt(dx * dx + dy * dy);
              const normX = len > 0 ? dx / len : 0;
              const normY = len > 0 ? dy / len : 1;
              const startX = prevX + normX * circleOffset;
              const startY = prevY + normY * circleOffset;
              const endX = x - normX * circleOffset;
              const endY = y - normY * circleOffset;

              return (
                <path
                  key={`backbone-${base.id}`}
                  d={`M ${startX} ${startY} Q ${(prevX + x) / 2} ${(prevY + y) / 2} ${endX} ${endY}`}
                  stroke="url(#mrna-backboneGradient)"
                  strokeWidth="4"
                  opacity={opacity * 0.9}
                  fill="none"
                  filter="url(#mrna-glow)"
                  strokeLinecap="round"
                />
              );
            })}

            {/* SECOND PASS: Draw nucleotide bases */}
            {bases.map((base, i) => {
              const y = i * 32 + 50;
              const waveOffset = Math.sin(animationTime + i * 0.4) * 15;
              const x = 100 + waveOffset;

              // 3D depth effect
              const zDepth = Math.sin(animationTime + i * 0.4);
              const opacity = 0.7 + zDepth * 0.3;
              const scale = 1 + zDepth * 0.05;

              return (
                <g key={`base-${base.id}`}>
                  {/* Base circle with shadow */}
                  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
                    {/* Shadow */}
                    <ellipse
                      cx="1.5"
                      cy="1.5"
                      rx="12"
                      ry="11"
                      fill="rgba(0,0,0,0.3)"
                      opacity={opacity * 0.5}
                    />
                    {/* Main circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r="12"
                      fill={`url(#${getBaseGradientId(base.base)})`}
                      opacity={opacity}
                      filter="url(#mrna-glow)"
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth="2"
                    />
                    {/* Base letter */}
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="bold"
                      opacity={opacity}
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >
                      {base.base}
                    </text>
                  </g>

                  {/* 5' / 3' direction indicators */}
                  {i === 0 && (
                    <text
                      x={x + 25}
                      y={y + 5}
                      fontSize="10"
                      fontWeight="bold"
                      fill="#F97316"
                      opacity={0.8}
                    >
                      5'
                    </text>
                  )}
                  {i === bases.length - 1 && (
                    <text
                      x={x + 25}
                      y={y + 5}
                      fontSize="10"
                      fontWeight="bold"
                      fill="#F97316"
                      opacity={0.8}
                    >
                      3'
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Floating particles for extra visual appeal */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={`mrna-particle-${i}`}
            className="absolute w-2 h-2 bg-orange-400 rounded-full opacity-20"
            style={{
              left: `${15 + ((i * 12) % 70)}%`,
              top: `${10 + ((i * 15) % 80)}%`,
              animation: `dnaFloat ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* mRNA Label */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500/20 rounded-md backdrop-blur-sm">
        <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
          mRNA
        </span>
      </div>
    </div>
  );
};

export default RnaStrand;
