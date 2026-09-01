// Flat, hard-edged icon set (RESONANCE: square caps, 2px, no glow).

import type { ReactNode } from "react";

interface IconProps {
  size?: number;
}

function Svg({ size = 18, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PlayIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <polygon points="8,5 19,12 8,19" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function PauseIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="7" y="5" width="3.5" height="14" fill="currentColor" stroke="none" />
      <rect x="13.5" y="5" width="3.5" height="14" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function NextIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <polygon points="6,5 15,12 6,19" fill="currentColor" stroke="none" />
      <rect x="17" y="5" width="2.5" height="14" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function PrevIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <polygon points="18,5 9,12 18,19" fill="currentColor" stroke="none" />
      <rect x="4.5" y="5" width="2.5" height="14" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function ShuffleIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3 7h4c6 0 6 10 12 10h2" />
      <path d="M3 17h4c2.5 0 4.2-1.8 5.6-3.9" />
      <path d="M13.2 9.4C14.7 7.9 16.4 7 19 7h2" />
      <path d="M18 4l3 3-3 3" />
      <path d="M18 14l3 3-3 3" />
    </Svg>
  );
}

export function RepeatIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </Svg>
  );
}

export function RepeatOneIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      <path d="M11 10h1v5" />
    </Svg>
  );
}

export function HeartIcon({ size, filled }: IconProps & { filled?: boolean }) {
  return (
    <Svg size={size}>
      <path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"
        fill={filled ? "currentColor" : "none"}
      />
    </Svg>
  );
}

export function DiamondIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <polygon points="12,3 21,12 12,21 3,12" />
      <polygon points="12,9 15,12 12,15 9,12" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function GridIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="4" width="7" height="7" />
      <rect x="4" y="13" width="7" height="7" />
      <rect x="13" y="13" width="7" height="7" />
    </Svg>
  );
}

export function BroadcastIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M16.2 7.8a6 6 0 0 1 0 8.4" />
      <path d="M7.8 16.2a6 6 0 0 1 0-8.4" />
      <path d="M19.1 4.9a10 10 0 0 1 0 14.2" />
      <path d="M4.9 19.1a10 10 0 0 1 0-14.2" />
    </Svg>
  );
}

export function ChevronDownIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function InfoIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5v.5" />
    </Svg>
  );
}
