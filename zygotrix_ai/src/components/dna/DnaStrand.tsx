import React, { useState, useEffect } from 'react';

interface DnaStrandProps {
  sequence: string;
  className?: string;
}

/**
 * Interactive DNA Double Helix Component with 3D animation
 * Visualizes DNA sequence as an animated double helix structure
 */
const DnaStrand: React.FC<DnaStrandProps> = ({ sequence, className = '' }) => {
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
      case 'A':
        return 'adenineGradient';
      case 'T':
        return 'thymineGradient';
      case 'G':
        return 'guanineGradient';
      case 'C':
        return 'cytosineGradient';
      default:
        return 'adenineGradient';
    }
  };

  // Get complementary base
  const getComplementaryBase = (base: string): string => {
    const upperBase = base.toUpperCase();
    switch (upperBase) {
      case 'A': return 'T';
      case 'T': return 'A';
      case 'G': return 'C';
      case 'C': return 'G';
      default: return 'N';
    }
  };

  // Get color for base pair
  const getBasePairColor = (base: string): string => {
    const upperBase = base.toUpperCase();
    // A-T pairs are red, G-C pairs are blue
    if (upperBase === 'A' || upperBase === 'T') return '#EF4444';
    if (upperBase === 'G' || upperBase === 'C') return '#3B82F6';
    return '#6B7280'; // Gray for unknown
  };

  // Get number of hydrogen bonds
  const getHydrogenBonds = (base: string): number => {
    const upperBase = base.toUpperCase();
    // A-T has 2 bonds, G-C has 3 bonds
    if (upperBase === 'A' || upperBase === 'T') return 2;
    if (upperBase === 'G' || upperBase === 'C') return 3;
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
        { id: 'bp-default-1', left: 'A', right: 'T', color: '#EF4444', bonds: 2 },
        { id: 'bp-default-2', left: 'G', right: 'C', color: '#3B82F6', bonds: 3 },
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
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Subtle background glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-emerald-500/8 via-teal-500/3 to-transparent rounded-full blur-xl" />

      {/* Vertical DNA Double Helix Structure */}
      <div className="relative w-full flex items-center justify-center">
        <svg
          viewBox={`0 0 300 ${dynamicHeight}`}
          className="w-full"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))',
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

            {/* FIRST PASS: Draw all backbone connections (behind everything) */}
            {basePairs.map((pair, i) => {
              if (i === 0) return null; // Skip first item - no previous connection

              const angle = (i * Math.PI) / 5;
              const y = i * 28 + 50;
              const helixRadius = 65;
              const waveOffset = Math.sin(animationTime + i * 0.3) * 6;
              const leftX = 150 + helixRadius * Math.cos(angle + animationTime * 0.5) + waveOffset;
              const rightX = 150 + helixRadius * Math.cos(angle + Math.PI + animationTime * 0.5) - waveOffset;

              const leftZ = Math.sin(angle + animationTime * 0.5);
              const rightZ = Math.sin(angle + Math.PI + animationTime * 0.5);
              const leftOpacity = 0.6 + leftZ * 0.4;
              const rightOpacity = 0.6 + rightZ * 0.4;
              const animationDelay = i * 0.08;

              const prevY = (i - 1) * 28 + 50;
              const prevWaveOffset = Math.sin(animationTime + (i - 1) * 0.3) * 6;
              const prevLeftX = 150 + helixRadius * Math.cos(((i - 1) * Math.PI) / 5 + animationTime * 0.5) + prevWaveOffset;
              const prevRightX = 150 + helixRadius * Math.cos(((i - 1) * Math.PI) / 5 + Math.PI + animationTime * 0.5) - prevWaveOffset;

              // Calculate offset to stop lines at circle edge (radius = 10 + 2 margin)
              const circleOffset = 12;

              // Left backbone: direction and offset
              const leftDx = leftX - prevLeftX;
              const leftDy = y - prevY;
              const leftLen = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
              const leftNormX = leftLen > 0 ? leftDx / leftLen : 0;
              const leftNormY = leftLen > 0 ? leftDy / leftLen : 1;
              const leftStartX = prevLeftX + leftNormX * circleOffset;
              const leftStartY = prevY + leftNormY * circleOffset;
              const leftEndX = leftX - leftNormX * circleOffset;
              const leftEndY = y - leftNormY * circleOffset;

              // Right backbone: direction and offset
              const rightDx = rightX - prevRightX;
              const rightDy = y - prevY;
              const rightLen = Math.sqrt(rightDx * rightDx + rightDy * rightDy);
              const rightNormX = rightLen > 0 ? rightDx / rightLen : 0;
              const rightNormY = rightLen > 0 ? rightDy / rightLen : 1;
              const rightStartX = prevRightX + rightNormX * circleOffset;
              const rightStartY = prevY + rightNormY * circleOffset;
              const rightEndX = rightX - rightNormX * circleOffset;
              const rightEndY = y - rightNormY * circleOffset;

              return (
                <g key={`backbone-${pair.id}`}>
                  {/* Left backbone curve - offset from circles */}
                  <path
                    d={`M ${leftStartX} ${leftStartY} Q ${(prevLeftX + leftX) / 2} ${(prevY + y) / 2} ${leftEndX} ${leftEndY}`}
                    stroke="url(#backboneGradient-seq)"
                    strokeWidth="3.5"
                    opacity={leftOpacity * 0.9}
                    fill="none"
                    filter="url(#glow-seq)"
                    strokeLinecap="round"
                    style={{ animationDelay: `${animationDelay}s`, animationDuration: '2s' }}
                  />
                  {/* Right backbone curve - offset from circles */}
                  <path
                    d={`M ${rightStartX} ${rightStartY} Q ${(prevRightX + rightX) / 2} ${(prevY + y) / 2} ${rightEndX} ${rightEndY}`}
                    stroke="url(#backboneGradient-seq)"
                    strokeWidth="3.5"
                    opacity={rightOpacity * 0.9}
                    fill="none"
                    filter="url(#glow-seq)"
                    strokeLinecap="round"
                    style={{ animationDelay: `${animationDelay + 0.1}s`, animationDuration: '2s' }}
                  />
                </g>
              );
            })}

            {/* SECOND PASS: Draw hydrogen bonds */}
            {basePairs.map((pair, i) => {
              const angle = (i * Math.PI) / 5;
              const y = i * 28 + 50;
              const helixRadius = 65;
              const waveOffset = Math.sin(animationTime + i * 0.3) * 6;
              const leftX = 150 + helixRadius * Math.cos(angle + animationTime * 0.5) + waveOffset;
              const rightX = 150 + helixRadius * Math.cos(angle + Math.PI + animationTime * 0.5) - waveOffset;

              const leftZ = Math.sin(angle + animationTime * 0.5);
              const rightZ = Math.sin(angle + Math.PI + animationTime * 0.5);
              const leftOpacity = 0.6 + leftZ * 0.4;
              const rightOpacity = 0.6 + rightZ * 0.4;
              const animationDelay = i * 0.08;

              // Offset hydrogen bonds to start/end at circle edge
              const bondOffset = 12;
              const bondLeftX = leftX + bondOffset;
              const bondRightX = rightX - bondOffset;

              return (
                <g key={`bonds-${pair.id}`}>
                  {Array.from({ length: pair.bonds }).map((_, bondIndex) => {
                    const verticalOffset = (bondIndex - (pair.bonds - 1) / 2) * 3;
                    return (
                      <line
                        key={`${pair.id}-bond-${bondIndex}`}
                        x1={bondLeftX}
                        y1={y + verticalOffset}
                        x2={bondRightX}
                        y2={y + verticalOffset}
                        stroke={pair.color}
                        strokeWidth="2"
                        opacity={Math.min(leftOpacity, rightOpacity) * 0.9}
                        strokeDasharray="5,3"
                        strokeLinecap="round"
                        style={{ animationDelay: `${animationDelay + bondIndex * 0.1}s` }}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* THIRD PASS: Draw nucleotide base circles (on top of everything) */}
            {basePairs.map((pair, i) => {
              const angle = (i * Math.PI) / 5;
              const y = i * 28 + 50;
              const helixRadius = 65;
              const waveOffset = Math.sin(animationTime + i * 0.3) * 6;
              const leftX = 150 + helixRadius * Math.cos(angle + animationTime * 0.5) + waveOffset;
              const rightX = 150 + helixRadius * Math.cos(angle + Math.PI + animationTime * 0.5) - waveOffset;

              const leftZ = Math.sin(angle + animationTime * 0.5);
              const rightZ = Math.sin(angle + Math.PI + animationTime * 0.5);
              const leftOpacity = 0.6 + leftZ * 0.4;
              const rightOpacity = 0.6 + rightZ * 0.4;
              const animationDelay = i * 0.08;

              return (
                <g key={`bases-${pair.id}`}>
                  {/* Left Base */}
                  <g transform={`translate(${leftX}, ${y})`}>
                    {/* Shadow */}
                    <ellipse
                      cx="1"
                      cy="1"
                      rx="10"
                      ry="9"
                      fill="rgba(0,0,0,0.25)"
                      opacity={leftOpacity * 0.6}
                    />
                    {/* Main circle */}
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
                    {/* Letter */}
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

                  {/* Right Base */}
                  <g transform={`translate(${rightX}, ${y})`}>
                    {/* Shadow */}
                    <ellipse
                      cx="1"
                      cy="1"
                      rx="10"
                      ry="9"
                      fill="rgba(0,0,0,0.25)"
                      opacity={rightOpacity * 0.6}
                    />
                    {/* Main circle */}
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
                    {/* Letter */}
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
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default DnaStrand;
