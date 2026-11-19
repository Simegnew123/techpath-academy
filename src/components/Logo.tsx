export default function Logo({
  className = "h-8 w-8",
  "aria-hidden": ariaHidden,
}: {
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={ariaHidden ? undefined : "img"}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : "TechPath Academy logo"}
    >
      {/* Rounded square background */}
      <rect width="40" height="40" rx="10" fill="url(#tp-grad)" />
      {/* Stylized "T" + path line */}
      <path
        d="M12 13h16M20 13v15"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Path/road dots — represents the "path" in TechPath */}
      <circle cx="20" cy="32" r="2" fill="white" opacity="0.9" />
      <circle cx="20" cy="27.5" r="1.5" fill="white" opacity="0.5" />
      <circle cx="20" cy="23.5" r="1" fill="white" opacity="0.3" />
      <defs>
        <linearGradient id="tp-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}
