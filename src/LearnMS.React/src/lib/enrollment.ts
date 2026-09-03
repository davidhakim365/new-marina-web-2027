/** Normalize API enrollment so "Active" is recognized even if serialized as a number. */
export function isEnrollmentActive(
  enrollment?: string | number | null,
  expiresAt?: string | null
): boolean {
  if (enrollment === "Active" || enrollment === 0 || enrollment === "0")
    return true;
  if (!expiresAt) return false;
  const expires = new Date(expiresAt).getTime();
  return Number.isFinite(expires) && expires > Date.now();
}

export function isEnrollmentExpired(
  enrollment?: string | number | null,
  expiresAt?: string | null
): boolean {
  if (isEnrollmentActive(enrollment, expiresAt)) return false;
  if (enrollment === "Expired" || enrollment === 1 || enrollment === "1")
    return true;
  return !!expiresAt;
}
