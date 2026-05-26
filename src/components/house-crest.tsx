import type { HouseId } from "@/lib/houses";

interface Props {
  house: HouseId;
  className?: string;
}

/**
 * Monoline geometric crests. All strokes use currentColor so they inherit
 * from the house theme.
 */
export function HouseCrest({ house, className }: Props) {
  const common = {
    viewBox: "0 0 200 200",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  if (house === "atlas") {
    return (
      <svg {...common} aria-label="House Atlas crest">
        <circle cx="100" cy="100" r="68" />
        <ellipse cx="100" cy="100" rx="68" ry="26" />
        <ellipse cx="100" cy="100" rx="26" ry="68" />
        <path d="M32 100 H168 M100 32 V168" />
        <path d="M55 55 L145 145 M145 55 L55 145" opacity="0.4" />
        <circle cx="100" cy="100" r="6" fill="currentColor" />
      </svg>
    );
  }

  if (house === "aurora") {
    return (
      <svg {...common} aria-label="House Aurora crest">
        <circle cx="100" cy="100" r="68" />
        <path d="M100 32 L108 88 L164 100 L108 112 L100 168 L92 112 L36 100 L92 88 Z" />
        <circle cx="100" cy="100" r="14" />
        <path d="M50 50 Q100 20 150 50" opacity="0.5" />
        <path d="M50 150 Q100 180 150 150" opacity="0.5" />
      </svg>
    );
  }

  if (house === "summit") {
    return (
      <svg {...common} aria-label="House Summit crest">
        <path d="M20 160 L70 70 L100 110 L130 50 L180 160 Z" />
        <path d="M55 95 L70 70 L85 95" />
        <path d="M115 75 L130 50 L145 75" />
        <path d="M20 160 H180" strokeWidth="2" />
        <circle cx="100" cy="40" r="4" fill="currentColor" />
      </svg>
    );
  }

  // eclipse
  return (
    <svg {...common} aria-label="House Eclipse crest">
      <circle cx="100" cy="100" r="68" />
      <circle cx="100" cy="100" r="52" opacity="0.7" />
      <circle cx="100" cy="100" r="36" opacity="0.5" />
      <circle cx="100" cy="100" r="20" opacity="0.3" />
      <path d="M100 32 a68 68 0 0 1 0 136 a52 52 0 0 0 0 -136" fill="currentColor" opacity="0.85" stroke="none" />
    </svg>
  );
}
