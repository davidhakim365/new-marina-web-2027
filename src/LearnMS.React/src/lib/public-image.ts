const IMGBB_HOST_SUFFIXES = [".ibb.co", ".ibb.co.com"];
const IMGBB_HOSTS = new Set([
  "i.ibb.co",
  "ibb.co",
  "thumb.ibb.co",
  "image.ibb.co",
  "i.ibb.co.com",
  "ibb.co.com",
]);

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice(7)}`;
  return trimmed;
}

export function isImgBbUrl(url: string): boolean {
  try {
    const parsed = new URL(normalizeUrl(url));
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      IMGBB_HOSTS.has(host) ||
      IMGBB_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
    );
  } catch {
    return false;
  }
}

/** Serve ImgBB photos from our API so phones that block i.ibb.co still see them. */
export function resolvePublicImageUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const normalized = normalizeUrl(url);
  if (!isImgBbUrl(normalized)) return normalized;
  return `/api/uploads/image?url=${encodeURIComponent(normalized)}`;
}
