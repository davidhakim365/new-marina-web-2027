import { cn } from "@/lib/utils";

const motifs = [
  { top: "10%", left: "6%", delay: "0s", kind: "globe" as const },
  { top: "22%", right: "8%", delay: "1.1s", kind: "compass" as const },
  { top: "48%", left: "3%", delay: "2.2s", kind: "scroll" as const },
  { top: "68%", right: "5%", delay: "0.7s", kind: "pyramid" as const },
  { top: "82%", left: "12%", delay: "1.6s", kind: "mapPin" as const },
  { top: "35%", right: "18%", delay: "2.8s", kind: "landmark" as const },
];

function MiniIcon({ kind }: { kind: (typeof motifs)[number]["kind"] }) {
  const common = "size-7 md:size-8 text-color1/35 dark:text-color1/45";
  if (kind === "globe") {
    return (
      <svg viewBox="0 0 32 32" className={common} fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="16" cy="16" r="11" />
        <ellipse cx="16" cy="16" rx="5" ry="11" />
        <path d="M5 16h22M16 5c3 3.5 3 18.5 0 22M16 5c-3 3.5-3 18.5 0 22" />
      </svg>
    );
  }
  if (kind === "compass") {
    return (
      <svg viewBox="0 0 32 32" className={common} fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="16" cy="16" r="11" />
        <path d="M16 6v4M16 22v4M6 16h4M22 16h4" />
        <path d="M16 10l3 10-3-2-3 2z" fill="currentColor" opacity="0.45" />
      </svg>
    );
  }
  if (kind === "scroll") {
    return (
      <svg viewBox="0 0 32 32" className={common} fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M8 8h14a3 3 0 013 3v12a2 2 0 01-2 2H10a2 2 0 01-2-2V8z" />
        <path d="M11 13h10M11 17h8M11 21h6" />
      </svg>
    );
  }
  if (kind === "pyramid") {
    return (
      <svg viewBox="0 0 32 32" className={common} fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M16 6l12 18H4L16 6z" />
        <path d="M16 6v18M8 20h16" opacity="0.5" />
      </svg>
    );
  }
  if (kind === "mapPin") {
    return (
      <svg viewBox="0 0 32 32" className={common} fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M16 28s-8-8.2-8-13a8 8 0 1116 0c0 4.8-8 13-8 13z" />
        <circle cx="16" cy="15" r="2.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={common} fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M6 24V12l5-4 5 3 5-3 5 4v12" />
      <path d="M11 24V14M16 24V15M21 24V14" />
    </svg>
  );
}

export function FloatingFormulas({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {motifs.map(({ top, left, right, delay, kind }) => (
        <span
          key={`${kind}-${top}`}
          style={{ top, left, right, animationDelay: delay }}
          className="absolute animate-float select-none"
        >
          <MiniIcon kind={kind} />
        </span>
      ))}
    </div>
  );
}

export const FloatingMotifs = FloatingFormulas;

export function AtomOrbit({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 220"
      className={cn("size-52 md:size-72 opacity-40 dark:opacity-30", className)}
      fill="none"
    >
      <circle cx="110" cy="110" r="48" className="stroke-color1/50" strokeWidth="1.5" />
      <ellipse cx="110" cy="110" rx="48" ry="18" className="stroke-color1/40" strokeWidth="1.2" />
      <ellipse cx="110" cy="110" rx="18" ry="48" className="stroke-teal/50" strokeWidth="1.2" />
      <path
        d="M40 90c30-40 110-40 140 0M40 130c30 40 110 40 140 0"
        className="stroke-gold/40"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <circle cx="110" cy="110" r="5" className="fill-color2" />
      <circle cx="158" cy="110" r="4" className="fill-gold animate-pulse-glow" />
      <circle cx="62" cy="110" r="3" className="fill-teal" />
    </svg>
  );
}

export const GlobeOrbit = AtomOrbit;

export function ContourMap({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 400"
      className={cn("absolute inset-0 size-full opacity-[0.12] dark:opacity-[0.18]", className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        d="M40 220c40-60 90-80 150-70s90 50 140 40 100-70 160-50 70 90 80 120"
        fill="none"
        stroke="currentColor"
        className="text-color1"
        strokeWidth="1.5"
      />
      <path
        d="M20 280c50-40 120-30 180-10s110 20 170-10 90-50 140-30"
        fill="none"
        stroke="currentColor"
        className="text-teal"
        strokeWidth="1.2"
      />
      <path
        d="M80 120c30-20 80-30 120-10s70 40 120 30 90-40 140-20"
        fill="none"
        stroke="currentColor"
        className="text-gold"
        strokeWidth="1"
        strokeDasharray="6 8"
      />
      <circle cx="190" cy="150" r="4" className="fill-color2" />
      <circle cx="340" cy="200" r="3" className="fill-teal" />
      <circle cx="480" cy="160" r="3.5" className="fill-gold" />
      <path d="M190 150l20-30M340 200l-15-25M480 160l10-28" className="stroke-color1/40" strokeWidth="1" />
    </svg>
  );
}

export function CompassRose({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      className={cn("size-28 md:size-36 text-color1/25", className)}
      fill="currentColor"
    >
      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="60" cy="60" r="38" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path d="M60 12l8 40-8 8-8-8z" />
      <path d="M60 108l8-40-8-8-8 8z" opacity="0.45" />
      <path d="M12 60l40 8 8-8-8-8z" opacity="0.55" />
      <path d="M108 60l-40 8-8-8 8-8z" opacity="0.55" />
      <circle cx="60" cy="60" r="4" className="fill-color2" />
    </svg>
  );
}

export function PyramidMotif({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 100"
      className={cn("size-40 text-gold/30", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M80 8l70 84H10L80 8z" />
      <path d="M80 8v84M35 70h90" opacity="0.5" />
      <path d="M50 52h60" opacity="0.35" />
    </svg>
  );
}

export function ScrollBanner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 180 80"
      className={cn("w-44 text-color1/25", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M16 16h130c8 0 14 6 14 14v28c0 6-4 10-10 10H28c-8 0-14-6-14-14V24c0-4 2-8 6-8z" />
      <path d="M36 32h90M36 42h70M36 52h50" opacity="0.55" />
      <circle cx="22" cy="40" r="6" opacity="0.4" />
    </svg>
  );
}

export function WavePattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={cn("absolute bottom-0 left-0 w-full h-20 md:h-28", className)}
    >
      <path
        d="M0,60 C360,110 720,10 1080,55 C1260,80 1380,40 1440,55 L1440,120 L0,120 Z"
        className="fill-background"
      />
      <path
        d="M0,80 C360,50 720,100 1080,75 C1260,60 1380,90 1440,75 L1440,120 L0,120 Z"
        className="fill-teal/10"
      />
    </svg>
  );
}

export function PhysicsGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        "[background-size:56px_56px]",
        "[background-image:linear-gradient(to_right,hsl(var(--color1)/0.06)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--color1)/0.06)_1px,transparent_1px)]",
        className
      )}
    />
  );
}

export const MapGrid = PhysicsGrid;

export function GlowOrb({
  className,
  color = "from-teal/25 to-gold/15",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full bg-gradient-to-br blur-3xl animate-pulse-glow",
        color,
        className
      )}
    />
  );
}

export function PhysicsDivider() {
  return (
    <div aria-hidden className="relative flex items-center justify-center py-4">
      <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-color1/35 to-transparent" />
      <svg viewBox="0 0 24 24" className="mx-4 size-5 shrink-0 text-color1/55" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1" opacity="0.45" />
        <path d="M12 5l2 7-2 7-2-7z" fill="currentColor" />
      </svg>
      <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-color1/35 to-transparent" />
    </div>
  );
}

export const CompassDivider = PhysicsDivider;
