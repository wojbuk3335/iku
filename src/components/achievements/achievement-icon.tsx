"use client";

type Props = {
  icon: string;
  size?: number;
  color?: string;
};

export function AchievementIcon({
  icon,
  size = 28,
  color = "currentColor",
}: Props) {
  const p = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: color,
    strokeWidth: 1.6,
    width: size,
    height: size,
    className: "shrink-0",
  };

  switch (icon) {
    case "trophy":
      return (
        <svg {...p}>
          <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
          <path d="M7 4H4a2 2 0 0 0 2 5h1M17 4h3a2 2 0 0 1-2 5h-1" />
        </svg>
      );
    case "medal":
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="5" />
          <path d="M8.5 13 7 22l5-3 5 3-1.5-9" />
        </svg>
      );
    case "star":
      return (
        <svg {...p}>
          <path d="m12 2 2.9 6.3L22 9.3l-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 7.1-1z" />
        </svg>
      );
    case "crown":
      return (
        <svg {...p}>
          <path d="m2 8 4 3 6-6 6 6 4-3v10H2z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...p}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "flame":
      return (
        <svg {...p}>
          <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-3-9 0 0-2 2-4 2s-4-2-4-2c0 3-3 5-3 9a7 7 0 0 0 7 7z" />
        </svg>
      );
    case "flag":
      return (
        <svg {...p}>
          <path d="M4 22V4M4 4h11l-1.5 4L15 12H4" />
        </svg>
      );
    case "heart":
      return (
        <svg {...p}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "music":
      return (
        <svg {...p}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "mic":
      return (
        <svg {...p}>
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" />
        </svg>
      );
    case "headphones":
      return (
        <svg {...p}>
          <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
          <path d="M21 16a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 16a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z" />
        </svg>
      );
    case "palette":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="7" r="1.2" fill={color} />
          <circle cx="8" cy="10" r="1.2" fill={color} />
          <circle cx="16" cy="10" r="1.2" fill={color} />
          <circle cx="9.5" cy="15" r="1.2" fill={color} />
        </svg>
      );
    case "camera":
      return (
        <svg {...p}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case "book":
      return (
        <svg {...p}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "theater":
      return (
        <svg {...p}>
          <circle cx="9" cy="10" r="1" fill={color} />
          <circle cx="15" cy="10" r="1" fill={color} />
          <path d="M12 2C7 2 3 6 3 11c0 2 1 4 2 5l1 4h4l1-2h2l1 2h4l1-4c1-1 2-3 2-5 0-5-4-9-9-9z" />
        </svg>
      );
    case "laptop":
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M2 20h20" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...p}>
          <path d="M5 13c2-5 7-8 14-9-1 7-4 12-9 14l-2-2-3 1 1-3z" />
          <circle cx="14" cy="10" r="1.5" />
        </svg>
      );
    case "zap":
      return (
        <svg {...p}>
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case "compass":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <path d="m16.2 7.8-2.1 6.4-6.4 2.1 2.1-6.4z" />
        </svg>
      );
    case "pizza":
      return (
        <svg {...p}>
          <path d="M12 2 2 22h20L12 2z" />
          <circle cx="12" cy="12" r="1" fill={color} />
          <circle cx="10" cy="16" r="1" fill={color} />
        </svg>
      );
    case "coffee":
      return (
        <svg {...p}>
          <path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
          <path d="M6 2v2M10 2v2M14 2v2" />
        </svg>
      );
    case "utensils":
      return (
        <svg {...p}>
          <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M7 2v20M15 2v6a3 3 0 0 0 6 0V2M18 8v14" />
        </svg>
      );
    case "soccer":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <path d="m12 2 2.5 5-2 1.5L12 12l-.5-3.5-2-1.5L12 2z" />
        </svg>
      );
    case "basketball":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <path d="M4.9 4.9c4 4 10.2 4 14.2 0M4.9 19.1c4-4 10.2-4 14.2 0M12 2v20M2 12h20" />
        </svg>
      );
    case "target":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "ticket":
      return (
        <svg {...p}>
          <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
          <path d="M9 7v10" strokeDasharray="2 3" />
        </svg>
      );
    case "check":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );
    case "users":
      return (
        <svg {...p}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...p}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "repeat":
      return (
        <svg {...p}>
          <path d="m17 1 4 4-4 4" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <path d="m7 23-4-4 4-4" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case "handshake":
      return (
        <svg {...p}>
          <path d="M11 17 7 13l1.5-1.5a2 2 0 0 1 2.8 0L14 14" />
          <path d="m14 14 1.5 1.5a2 2 0 0 0 2.8 0L20 14" />
          <path d="M7 13 4.5 10.5a2 2 0 0 1 0-2.8L7 5" />
          <path d="m20 14 2-2a2 2 0 0 0 0-2.8L19.5 6.5" />
          <path d="M9 7h4M14 17h-3" />
        </svg>
      );
    case "podium":
      return (
        <svg {...p}>
          <path d="M4 20h4v-6H4zM10 20h4V8h-4zM16 20h4v-4h-4z" />
          <path d="M12 4v2M10 6h4" />
        </svg>
      );
    case "gem":
      return (
        <svg {...p}>
          <path d="M6 3h12l4 6-10 12L2 9z" />
          <path d="M2 9h20M12 21 6 9l3-6M12 21l6-12-3-6" />
        </svg>
      );
    case "gift":
      return (
        <svg {...p}>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
          <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 8 12 8s3-5 4.5-5a2.5 2.5 0 0 1 0 5" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        </svg>
      );
  }
}
