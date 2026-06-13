"use client";

import { busynessLevel } from "@/types";

interface BusynessGaugeProps {
  popularity: number;
  size?: number;
  showLabel?: boolean;
}

export default function BusynessGauge({
  popularity,
  size = 160,
  showLabel = true,
}: BusynessGaugeProps) {
  const level = busynessLevel(popularity);
  const color =
    level === "quiet" ? "#22c55e" :
    level === "moderate" ? "#eab308" :
    level === "busy" ? "#ef4444" : "#7c3aed";
  const label =
    level === "quiet" ? "Quiet" :
    level === "moderate" ? "Moderate" :
    level === "busy" ? "Busy" : "Packed!";

  const radius = (size - 20) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (popularity / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center text-center"
        style={{ width: size, height: size }}
      >
        <span className="text-3xl font-bold" style={{ color }}>
          {Math.round(popularity)}%
        </span>
        {showLabel && (
          <span className="mt-1 text-sm font-medium text-gray-600">{label}</span>
        )}
      </div>
    </div>
  );
}
