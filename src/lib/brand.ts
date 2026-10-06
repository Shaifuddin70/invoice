import type { BusinessProfile } from "@/db/schema";

/** Versioned so browsers refetch the cached logo after it changes. */
export function logoUrl(profile: Pick<BusinessProfile, "logoDataUrl">) {
  const data = profile.logoDataUrl;
  if (!data) return null;
  let hash = 0;
  for (let i = 0; i < data.length; i += 97) hash = (hash * 31 + data.charCodeAt(i)) | 0;
  return `/api/logo?v=${(hash >>> 0).toString(36)}${data.length.toString(36)}`;
}
