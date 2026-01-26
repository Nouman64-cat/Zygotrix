"use client";

import React, { useState, useEffect } from "react";

// Interactive DNA Strand Component with ATCG Base Pairs
const DNAStrand: React.FC = () => {
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

    // Generate more base pairs for a longer, more realistic DNA strand
    const basePairs = [
        { id: "bp-1", left: "A", right: "T", color: "#EF4444", bonds: 2 }, // Red for A-T (2 hydrogen bonds)
        { id: "bp-2", left: "G", right: "C", color: "#3B82F6", bonds: 3 }, // Blue for G-C (3 hydrogen bonds)
        { id: "bp-3", left: "T", right: "A", color: "#EF4444", bonds: 2 }, // Red for T-A
        { id: "bp-4", left: "C", right: "G", color: "#3B82F6", bonds: 3 }, // Blue for C-G
        { id: "bp-5", left: "A", right: "T", color: "#EF4444", bonds: 2 },
        { id: "bp-6", left: "G", right: "C", color: "#3B82F6", bonds: 3 },
        { id: "bp-7", left: "C", right: "G", color: "#3B82F6", bonds: 3 },
        { id: "bp-8", left: "T", right: "A", color: "#EF4444", bonds: 2 },
        { id: "bp-9", left: "A", right: "T", color: "#EF4444", bonds: 2 },
        { id: "bp-10", left: "G", right: "C", color: "#3B82F6", bonds: 3 },
        { id: "bp-11", left: "T", right: "A", color: "#EF4444", bonds: 2 },
        { id: "bp-12", left: "C", right: "G", color: "#3B82F6", bonds: 3 },
        { id: "bp-13", left: "A", right: "T", color: "#EF4444", bonds: 2 },
        { id: "bp-14", left: "G", right: "C", color: "#3B82F6", bonds: 3 },
        { id: "bp-15", left: "T", right: "A", color: "#EF4444", bonds: 2 },
        { id: "bp-16", left: "C", right: "G", color: "#3B82F6", bonds: 3 },
        { id: "bp-17", left: "A", right: "T", color: "#EF4444", bonds: 2 },
        { id: "bp-18", left: "G", right: "C", color: "#3B82F6", bonds: 3 },
        { id: "bp-19", left: "T", right: "A", color: "#EF4444", bonds: 2 },
        { id: "bp-20", left: "C", right: "G", color: "#3B82F6", bonds: 3 },
    ];

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="relative w-full max-w-2xl h-[700px] mx-auto overflow-hidden bg-transparent" />; // Show placeholder to prevent layout shift
    }

    return (
        <div className="relative w-full max-w-2xl h-[700px] mx-auto overflow-hidden">
            {/* Subtle background glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/8 via-purple-500/3 to-transparent rounded-full blur-xl" />

            {/* Vertical DNA Double Helix Structure */}
            <div className="relative w-full h-full flex items-center justify-center">
                <svg
                    viewBox="0 0 300 700"
                    className="w-full h-full"
                    style={{
                        filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))",
                    }}
                >
                    {/* Static vertical DNA structure */}
                    <g>
                        <defs>
                            {/* Enhanced gradients for more realistic appearance */}
                            <linearGradient
                                id="backboneGradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.8" />
                                <stop offset="30%" stopColor="#3B82F6" stopOpacity="0.9" />
                                <stop offset="70%" stopColor="#10B981" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
                            </linearGradient>

                            <radialGradient id="adenineGradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#FEE2E2" />
                                <stop offset="30%" stopColor="#EF4444" />
                                <stop offset="100%" stopColor="#DC2626" />
                            </radialGradient>

                            <radialGradient id="thymineGradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#FED7AA" />
                                <stop offset="30%" stopColor="#F97316" />
                                <stop offset="100%" stopColor="#EA580C" />
                            </radialGradient>

                            <radialGradient id="guanineGradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#DBEAFE" />
                                <stop offset="30%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#2563EB" />
                            </radialGradient>

                            <radialGradient id="cytosineGradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#D1FAE5" />
                                <stop offset="30%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#059669" />
                            </radialGradient>

                            {/* Subtle glow effects for clarity */}
                            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            <filter
                                id="strongGlow"
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
                            <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
                                <feDropShadow
                                    dx="1"
                                    dy="1"
                                    stdDeviation="1"
                                    floodOpacity="0.4"
                                />
                            </filter>
                        </defs>

                        {/* Draw the vertical DNA double helix with moving strands */}
                        {/* First pass: Draw all backbone connections (behind everything) */}
                        {basePairs.map((pair, i) => {
                            if (i === 0) return null; // Skip first item as it has no previous connection

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

                            // Calculate offset to stop lines at circle edge (radius = 10, add 2 for margin)
                            const circleOffset = 12;

                            // Left backbone: calculate direction and offset start/end points
                            const leftDx = leftX - prevLeftX;
                            const leftDy = y - prevY;
                            const leftLen = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
                            const leftNormX = leftDx / leftLen;
                            const leftNormY = leftDy / leftLen;
                            const leftStartX = prevLeftX + leftNormX * circleOffset;
                            const leftStartY = prevY + leftNormY * circleOffset;
                            const leftEndX = leftX - leftNormX * circleOffset;
                            const leftEndY = y - leftNormY * circleOffset;

                            // Right backbone: calculate direction and offset start/end points
                            const rightDx = rightX - prevRightX;
                            const rightDy = y - prevY;
                            const rightLen = Math.sqrt(rightDx * rightDx + rightDy * rightDy);
                            const rightNormX = rightDx / rightLen;
                            const rightNormY = rightDy / rightLen;
                            const rightStartX = prevRightX + rightNormX * circleOffset;
                            const rightStartY = prevY + rightNormY * circleOffset;
                            const rightEndX = rightX - rightNormX * circleOffset;
                            const rightEndY = y - rightNormY * circleOffset;

                            return (
                                <g key={`backbone-${pair.id}`}>
                                    {/* Left backbone with flowing curve - offset from circle centers */}
                                    <path
                                        d={`M ${leftStartX} ${leftStartY} Q ${(prevLeftX + leftX) / 2} ${(prevY + y) / 2} ${leftEndX} ${leftEndY}`}
                                        stroke="url(#backboneGradient)"
                                        strokeWidth="3.5"
                                        opacity={leftOpacity * 0.9}
                                        fill="none"
                                        filter="url(#glow)"
                                        strokeLinecap="round"
                                        style={{ animationDelay: `${animationDelay}s`, animationDuration: "2s" }}
                                    />
                                    {/* Right backbone with flowing curve - offset from circle centers */}
                                    <path
                                        d={`M ${rightStartX} ${rightStartY} Q ${(prevRightX + rightX) / 2} ${(prevY + y) / 2} ${rightEndX} ${rightEndY}`}
                                        stroke="url(#backboneGradient)"
                                        strokeWidth="3.5"
                                        opacity={rightOpacity * 0.9}
                                        fill="none"
                                        filter="url(#glow)"
                                        strokeLinecap="round"
                                        style={{ animationDelay: `${animationDelay + 0.1}s`, animationDuration: "2s" }}
                                    />
                                </g>
                            );
                        })}

                        {/* Second pass: Draw hydrogen bonds */}
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
                                <g key={`bonds-${pair.id}`}>
                                    {/* Hydrogen Bonds */}
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
                                                style={{ animationDelay: `${animationDelay + bondIndex * 0.1}s` }}
                                            />
                                        );
                                    })}
                                </g>
                            );
                        })}

                        {/* Third pass: Draw nucleotide bases (on top of everything) */}
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
                                <g
                                    key={`bases-${pair.id}`}
                                    style={{
                                        animation: `dnaPulse 3s ease-in-out infinite`,
                                        animationDelay: `${animationDelay}s`,
                                    }}
                                >
                                    {/* Left Base with 3D appearance */}
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
                                            filter="url(#glow)"
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

                                    {/* Right Base with 3D appearance */}
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
                                            filter="url(#glow)"
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
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>

            {/* Floating particles for extra visual appeal */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 12 }, (_, i) => (
                    <div
                        key={`dna-particle-${i}`}
                        className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20"
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

export default DNAStrand;
