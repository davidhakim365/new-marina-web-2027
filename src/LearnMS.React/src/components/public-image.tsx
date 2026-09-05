import { resolvePublicImageUrl } from "@/lib/public-image";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
};

export function PublicImage({ src, alt = "", className }: Props) {
  const original = src?.trim() || "";
  const proxied = resolvePublicImageUrl(original);
  const [mode, setMode] = useState<"proxy" | "direct" | "failed">("proxy");

  useEffect(() => {
    setMode("proxy");
  }, [original]);

  if (!original || !proxied) return null;

  if (mode === "failed") {
    return (
      <div
        className={cn(
          "flex min-h-24 items-center justify-center rounded-xl bg-muted px-3 text-center text-sm text-muted-foreground",
          className
        )}
      >
        Photo could not be loaded
      </div>
    );
  }

  const displaySrc = mode === "direct" ? original : proxied;

  return (
    <img
      src={displaySrc}
      alt={alt}
      referrerPolicy="no-referrer"
      decoding="async"
      loading="eager"
      className={cn("h-auto max-w-full shrink-0 object-contain", className)}
      onError={() => {
        if (mode === "proxy" && proxied !== original) setMode("direct");
        else setMode("failed");
      }}
    />
  );
}
