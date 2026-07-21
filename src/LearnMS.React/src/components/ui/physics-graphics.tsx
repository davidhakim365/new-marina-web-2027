import { cn } from "@/lib/utils";

const motifs = [
  { text: "🌍", top: "12%", left: "8%", delay: "0s", size: "text-lg md:text-xl" },
  { text: "🗺", top: "28%", right: "6%", delay: "1.2s", size: "text-base md:text-lg" },
  { text: "🧭", top: "55%", left: "4%", delay: "2.4s", size: "text-xl md:text-2xl" },
  { text: "📜", top: "70%", right: "10%", delay: "0.8s", size: "text-sm md:text-base" },
  { text: "🏛", top: "85%", left: "15%", delay: "1.8s", size: "text-sm md:text-base" },
  { text: "✦", top: "18%", right: "18%", delay: "3s", size: "text-sm md:text-base" },
  { text: "⌛", top: "45%", right: "4%", delay: "2s", size: "text-sm md:text-base" },
];

/** Floating social-studies motifs (legacy export name kept for imports). */
export function FloatingFormulas({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {motifs.map(({ text, top, left, right, delay, size }) => (
        <span
          key={`${text}-${top}`}
          style={{ top, left, right, animationDelay: delay }}
          className={cn(
            "absolute select-none animate-float opacity-40 dark:opacity-50",
            size
          )}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

export const FloatingMotifs = FloatingFormulas;

/** Globe orbit decoration (legacy name AtomOrbit). */
export function AtomOrbit({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={cn("size-48 md:size-64 opacity-30 dark:opacity-20", className)}
      fill="none"
    >
      <circle cx="100" cy="100" r="36" stroke="currentColor" strokeWidth="1.5" className="text-color2" />
      <ellipse
        cx="100"
        cy="100"
        rx="36"
        ry="14"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-color2/80"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="14"
        ry="36"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-color1/80"
      />
      <circle cx="100" cy="100" r="4" fill="currentColor" className="text-color2" />
      <circle
        cx="160"
        cy="100"
        r="5"
        fill="currentColor"
        className="text-amber-400 animate-pulse-glow"
      />
      <path
        d="M100 64 A36 36 0 0 1 136 100"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        className="text-color2/50 animate-orbit origin-center"
        style={{ transformOrigin: "100px 100px" }}
      />
    </svg>
  );
}

export const GlobeOrbit = AtomOrbit;

export function WavePattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={cn("absolute bottom-0 left-0 w-full h-24 md:h-32", className)}
    >
      <path
        d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z"
        className="fill-hero"
      />
      <path
        d="M0,80 C360,40 720,100 1080,70 C1260,50 1380,90 1440,70 L1440,120 L0,120 Z"
        className="fill-color2/5 dark:fill-color2/10"
      />
    </svg>
  );
}

/** Soft map-style grid (legacy name PhysicsGrid). */
export function PhysicsGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        "[background-size:48px_48px]",
        "[background-image:linear-gradient(to_right,hsl(var(--color2)/0.07)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--color2)/0.07)_1px,transparent_1px)]",
        className
      )}
    />
  );
}

export const MapGrid = PhysicsGrid;

export function GlowOrb({
  className,
  color = "from-color2/30 to-color1/20",
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

/** Compass divider (legacy name PhysicsDivider). */
export function PhysicsDivider() {
  return (
    <div aria-hidden className="relative flex items-center justify-center py-4">
      <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-color2/40 to-transparent" />
      <svg viewBox="0 0 24 24" className="mx-4 size-5 text-color2/60 shrink-0" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <path d="M12 5l2 7-2 7-2-7z" fill="currentColor" className="text-color2" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
      <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-color2/40 to-transparent" />
    </div>
  );
}

export const CompassDivider = PhysicsDivider;
