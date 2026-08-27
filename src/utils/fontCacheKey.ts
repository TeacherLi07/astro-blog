import { readGeneratedFontAsset } from "@/utils/fontAsset";

/**
 * Returns a short cache-busting key derived from the generated font manifest.
 * When the font subset changes, the outputSha256 changes and the key changes,
 * causing browsers to re-fetch /fonts.css instead of serving a stale cached copy
 * that points to a deleted woff2 file.
 */
export function getFontCacheKey(): string {
  const result = readGeneratedFontAsset();
  if (!result.valid) return "";
  return result.asset.outputSha256?.slice(0, 12) ?? "";
}

