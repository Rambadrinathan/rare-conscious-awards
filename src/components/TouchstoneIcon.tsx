type Props = {
  touchstoneKey: string;
  kind: "cardinal" | "ordinal";
  className?: string;
};

const color = (kind: "cardinal" | "ordinal") =>
  kind === "cardinal" ? "var(--rare-green)" : "var(--rare-gold)";

export function TouchstoneIcon({ touchstoneKey, kind, className = "h-10 w-10" }: Props) {
  const stroke = color(kind);
  const common = {
    className,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };

  switch (touchstoneKey) {
    case "energy":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="16" stroke={stroke} strokeWidth="2" />
          <path
            d="M26 12 L18 26 H24 L22 36 L32 20 H25 Z"
            fill={stroke}
          />
        </svg>
      );
    case "water":
      return (
        <svg {...common}>
          <path
            d="M24 8 C24 8 12 22 12 30 C12 37 17.5 41 24 41 C30.5 41 36 37 36 30 C36 22 24 8 24 8 Z"
            stroke={stroke}
            strokeWidth="2"
            fill="none"
          />
          <circle cx="24" cy="30" r="5" fill={stroke} opacity="0.35" />
        </svg>
      );
    case "waste":
      return (
        <svg {...common}>
          <path
            d="M16 18 H32 V38 C32 39.5 30.5 41 29 41 H19 C17.5 41 16 39.5 16 38 V18 Z"
            stroke={stroke}
            strokeWidth="2"
          />
          <path d="M14 18 H34" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M20 14 H28" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M21 24 V34 M27 24 V34" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "wellbeing":
      return (
        <svg {...common}>
          <path
            d="M8 26 H14 L18 16 L24 34 L28 22 L32 26 H40"
            stroke={stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M34 32 C34 32 36 30 38 32 C40 34 34 38 34 38 C34 38 28 34 30 32 C32 30 34 32 34 32 Z"
            fill={stroke}
          />
        </svg>
      );
    case "inclusivity":
      return (
        <svg {...common}>
          <path
            d="M24 40 C24 40 10 30 10 20 C10 14 14.5 11 18.5 11 C21.5 11 23.5 13 24 14 C24.5 13 26.5 11 29.5 11 C33.5 11 38 14 38 20 C38 30 24 40 24 40 Z"
            stroke={stroke}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    case "heritage":
      return (
        <svg {...common}>
          <path
            d="M10 36 H38 M12 36 V22 L24 12 L36 22 V36"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M20 36 V28 H28 V36" stroke={stroke} strokeWidth="2" />
          <path d="M18 20 H20 M28 20 H30" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "biodiversity":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="14" stroke={stroke} strokeWidth="2" />
          <path
            d="M20 28 C18 24 20 18 24 16 C28 18 30 24 28 28 C26 30 22 30 20 28 Z"
            fill={stroke}
          />
          <circle cx="22" cy="22" r="1.5" fill="var(--rare-white)" />
          <circle cx="26" cy="22" r="1.5" fill="var(--rare-white)" />
        </svg>
      );
    case "light_footprint":
      return (
        <svg {...common}>
          <ellipse cx="20" cy="28" rx="6" ry="9" stroke={stroke} strokeWidth="2" />
          <circle cx="28" cy="18" r="3.5" fill={stroke} opacity="0.85" />
          <circle cx="33" cy="14" r="2.5" fill={stroke} opacity="0.55" />
          <circle cx="36.5" cy="10.5" r="1.8" fill={stroke} opacity="0.35" />
        </svg>
      );
    case "community":
      return (
        <svg {...common}>
          <circle cx="24" cy="16" r="4" stroke={stroke} strokeWidth="2" />
          <circle cx="14" cy="28" r="4" stroke={stroke} strokeWidth="2" />
          <circle cx="34" cy="28" r="4" stroke={stroke} strokeWidth="2" />
          <circle cx="24" cy="34" r="4" stroke={stroke} strokeWidth="2" />
          <path
            d="M24 20 V30 M18 28 H30 M20 30 L14 28 M28 30 L34 28"
            stroke={stroke}
            strokeWidth="1.6"
          />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="12" stroke={stroke} strokeWidth="2" />
        </svg>
      );
  }
}
