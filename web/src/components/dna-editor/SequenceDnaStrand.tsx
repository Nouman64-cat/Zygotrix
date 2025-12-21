import React, { useState, useEffect } from "react";

interface SequenceDnaStrandProps {
  sequence: string;
}

// Interactive DNA Strand Component that visualizes user's DNA sequence
const SequenceDnaStrand: React.FC<SequenceDnaStrandProps> = ({
  sequence
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

  // Helper function to get gradient ID for bases
  const getBaseGradientId = (base: string): string => {
    switch (base.toUpperCase()) {
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

  // Get complementary base
  const getComplementaryBase = (base: string): string => {
    const upperBase = base.toUpperCase();
    switch (upperBase) {
      case "A": return "T";
      case "T": return "A";
      case "G": return "C";
      case "C": return "G";
      default: return "N";
    }
  };

  // Get color for base pair
  const getBasePairColor = (base: string): string => {
    const upperBase = base.toUpperCase();
    // A-T pairs are red, G-C pairs are blue
    if (upperBase === "A" || upperBase === "T") return "#EF4444";
    if (upperBase === "G" || upperBase === "C") return "#3B82F6";
    return "#6B7280"; // Gray for unknown
  };

  // Get number of hydrogen bonds
  const getHydrogenBonds = (base: string): number => {
    const upperBase = base.toUpperCase();
    // A-T has 2 bonds, G-C has 3 bonds
    if (upperBase === "A" || upperBase === "T") return 2;
    if (upperBase === "G" || upperBase === "C") return 3;
    return 2;
  };

  // Parse sequence into base pairs
  const parseSequence = (): Array<{
    id: string;
    left: string;
    right: string;
    color: string;
    bonds: number;
  }> => {
    if (!sequence || sequence.trim().length === 0) {
      // Return default sequence if empty
      return [
        { id: "bp-default-1", left: "A", right: "T", color: "#EF4444", bonds: 2 },
        { id: "bp-default-2", left: "G", right: "C", color: "#3B82F6", bonds: 3 },
      ];
    }

    const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
    const basePairs = [];

    // Display ALL bases in the sequence
    for (let i = 0; i < cleanSeq.length; i++) {
      const leftBase = cleanSeq[i];
      const rightBase = getComplementaryBase(leftBase);
      basePairs.push({
        id: `bp-${i}`,
        left: leftBase,
        right: rightBase,
        color: getBasePairColor(leftBase),
        bonds: getHydrogenBonds(leftBase),
      });
    }

    return basePairs;
  };

  const basePairs = parseSequence();

  // Calculate dynamic height based on number of base pairs
  const dynamicHeight = Math.max(400, basePairs.length * 28 + 100);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Subtle background glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-emerald-500/8 via-teal-500/3 to-transparent rounded-full blur-xl" />

      {/* Vertical DNA Double Helix Structure */}
      <div className="relative w-full flex items-center justify-center">
        <svg
          viewBox={`0 0 300 ${dynamicHeight}`}
          className="w-full"
          style={{
            filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))",
            height: `${dynamicHeight}px`,
          }}
        >
          {/* Static vertical DNA structure */}
          <g>
            <defs>
              {/* Enhanced gradients for more realistic appearance */}
              <linearGradient
                id="backboneGradient-seq"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#065F46" stopOpacity="0.8" />
                <stop offset="30%" stopColor="#10B981" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#14B8A6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0D9488" stopOpacity="0.8" />
              </linearGradient>

              <radialGradient id="adenineGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF3C7" />
                <stop offset="30%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" />
              </radialGradient>

              <radialGradient id="thymineGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FECACA" />
                <stop offset="30%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#DC2626" />
              </radialGradient>

              <radialGradient id="guanineGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E0E7FF" />
                <stop offset="30%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#7C3AED" />
              </radialGradient>

              <radialGradient id="cytosineGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#CFFAFE" />
                <stop offset="30%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0891B2" />
              </radialGradient>

              {/* Subtle glow effects for clarity */}
              <filter id="glow-seq" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter
                id="strongGlow-seq"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Sharp shadow effect for depth */}
              <filter id="shadow-seq" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow
                  dx="1"
                  dy="1"
                  stdDeviation="1"
                  floodOpacity="0.4"
                />
              </filter>
            </defs>

            {/* Draw the vertical DNA double helix with moving strands */}
            {basePairs.map((pair, i) => {
              const angle = (i * Math.PI) / 5; // Gentler helix curve for vertical display
              const y = i * 28 + 50; // Vertical spacing
              // Calculate positions for moving helix with wave-like motion
              const helixRadius = 65; // Increased for more hollow space
              const waveOffset = Math.sin(animationTime + i * 0.3) * 6; // Reduced wave for cleaner look
              const leftX =
                150 +
                helixRadius * Math.cos(angle + animationTime * 0.5) +
                waveOffset;
              const rightX =
                150 +
                helixRadius * Math.cos(angle + Math.PI + animationTime * 0.5) -
                waveOffset;

              // Calculate depth for 3D effect (simulate perspective)
              const leftZ = Math.sin(angle + animationTime * 0.5);
              const rightZ = Math.sin(angle + Math.PI + animationTime * 0.5);

              // Enhanced depth-based effects without zoom
              const leftOpacity = 0.6 + leftZ * 0.4;
              const rightOpacity = 0.6 + rightZ * 0.4;

              // Dynamic animation delays for wave effect
              const animationDelay = i * 0.08;

              return (
                <g
                  key={pair.id}
                  style={{
                    animation: `dnaPulse 3s ease-in-out infinite`,
                    animationDelay: `${animationDelay}s`,
                  }}
                >
                  {/* Enhanced Base Pair Connection (Hydrogen Bonds) */}
                  {/* Multiple lines to represent hydrogen bonds more accurately */}
                  {Array.from({ length: pair.bonds }).map((_, bondIndex) => {
                    const bondOffset = (bondIndex - (pair.bonds - 1) / 2) * 3;
                    return (
                      <line
                        key={`${pair.id}-bond-${bondIndex}`}
                        x1={leftX}
                        y1={y + bondOffset}
                        x2={rightX}
                        y2={y + bondOffset}
                        stroke={pair.color}
                        strokeWidth="2"
                        opacity={Math.min(leftOpacity, rightOpacity) * 0.9}
                        strokeDasharray="5,3"
                        strokeLinecap="round"
                        style={{
                          animationDelay: `${
                            animationDelay + bondIndex * 0.1
                          }s`,
                        }}
                      />
                    );
                  })}

                  {/* Enhanced Left Base with 3D appearance */}
                  <g transform={`translate(${leftX}, ${y})`}>
                    {/* Base shadow for depth */}
                    <ellipse
                      cx="1"
                      cy="1"
                      rx="10"
                      ry="9"
                      fill="rgba(0,0,0,0.25)"
                      opacity={leftOpacity * 0.6}
                    />
                    {/* Main base circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r="10"
                      fill={`url(#${getBaseGradientId(pair.left)})`}
                      opacity={leftOpacity}
                      filter="url(#glow-seq)"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="1.5"
                    />
                    {/* Base letter */}
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="white"
                      fontSize="9"
                      fontWeight="bold"
                      opacity={leftOpacity}
                    >
                      {pair.left}
                    </text>
                  </g>

                  {/* Enhanced Right Base with 3D appearance */}
                  <g transform={`translate(${rightX}, ${y})`}>
                    {/* Base shadow for depth */}
                    <ellipse
                      cx="1"
                      cy="1"
                      rx="10"
                      ry="9"
                      fill="rgba(0,0,0,0.25)"
                      opacity={rightOpacity * 0.6}
                    />
                    {/* Main base circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r="10"
                      fill={`url(#${getBaseGradientId(pair.right)})`}
                      opacity={rightOpacity}
                      filter="url(#glow-seq)"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="1.5"
                    />
                    {/* Base letter */}
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="white"
                      fontSize="9"
                      fontWeight="bold"
                      opacity={rightOpacity}
                    >
                      {pair.right}
                    </text>
                  </g>

                  {/* Enhanced Backbone connections with smooth curves */}
                  {i > 0 &&
                    (() => {
                      const prevY = (i - 1) * 28 + 50;
                      const prevWaveOffset =
                        Math.sin(animationTime + (i - 1) * 0.3) * 6; // Match reduced wave
                      const prevLeftX =
                        150 +
                        helixRadius *
                          Math.cos(
                            ((i - 1) * Math.PI) / 5 + animationTime * 0.5
                          ) +
                        prevWaveOffset;
                      const prevRightX =
                        150 +
                        helixRadius *
                          Math.cos(
                            ((i - 1) * Math.PI) / 5 +
                              Math.PI +
                              animationTime * 0.5
                          ) -
                        prevWaveOffset;

                      return (
                        <>
                          {/* Left backbone with flowing curve */}
                          <path
                            d={`M ${prevLeftX} ${prevY}
                              Q ${(prevLeftX + leftX) / 2} ${(prevY + y) / 2}
                              ${leftX} ${y}`}
                            stroke="url(#backboneGradient-seq)"
                            strokeWidth="3.5"
                            opacity={leftOpacity * 0.9}
                            fill="none"
                            filter="url(#glow-seq)"
                            strokeLinecap="round"
                            style={{
                              animationDelay: `${animationDelay}s`,
                              animationDuration: "2s",
                            }}
                          />
                          {/* Right backbone with flowing curve */}
                          <path
                            d={`M ${prevRightX} ${prevY}
                              Q ${(prevRightX + rightX) / 2} ${(prevY + y) / 2}
                              ${rightX} ${y}`}
                            stroke="url(#backboneGradient-seq)"
                            strokeWidth="3.5"
                            opacity={rightOpacity * 0.9}
                            fill="none"
                            filter="url(#glow-seq)"
                            strokeLinecap="round"
                            style={{
                              animationDelay: `${animationDelay + 0.1}s`,
                              animationDuration: "2s",
                            }}
                          />
                        </>
                      );
                    })()}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Floating particles for extra visual appeal */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`dna-particle-${i}`}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-20"
            style={{
              left: `${10 + ((i * 7) % 80)}%`,
              top: `${15 + ((i * 11) % 70)}%`,
              animation: `dnaFloat ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SequenceDnaStrand;
