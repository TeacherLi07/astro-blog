import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { fontRelease } from "../../scripts/fonts/shared.mjs";

export type FontAssetScope = "full" | "subset";

export type GeneratedFontAsset = {
  scope: FontAssetScope;
  tag: string;
  assetName: string;
  sourceSha256: string;
  publicPath: string;
  weightMin: number;
  weightDefault: number;
  weightMax: number;
  outputSha256?: string;
  charsetCount?: number;
  requestedCharsetCount?: number;
};

export type GeneratedFontAssetResult =
  { readonly valid: true; readonly asset: GeneratedFontAsset } | { readonly valid: false; readonly reason: string };

const manifestPath = ".astro/font-asset.json";
const generatedFontPathPattern = /^\/fonts\/generated\/[A-Za-z0-9._-]+\.woff2$/;
const sha256Pattern = /^[a-f0-9]{64}$/;

function invalid(reason: string): GeneratedFontAssetResult {
  return { valid: false, reason };
}

export function readGeneratedFontAsset(): GeneratedFontAssetResult {
  if (!existsSync(manifestPath)) {
    return invalid(`manifest not found at ${manifestPath}`);
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return invalid(`manifest is not valid JSON (${detail})`);
  }

  if (typeof parsedValue !== "object" || parsedValue === null) {
    return invalid("manifest root must be an object");
  }

  const manifest = parsedValue as Partial<GeneratedFontAsset>;

  if (manifest.scope !== "full" && manifest.scope !== "subset") {
    return invalid('manifest scope must be either "full" or "subset"');
  }

  if (
    manifest.tag !== fontRelease.tag ||
    manifest.assetName !== fontRelease.assetName ||
    manifest.sourceSha256 !== fontRelease.sha256
  ) {
    return invalid("manifest belongs to a different font release");
  }

  const { min, default: defaultWeight, max } = fontRelease.weightAxis;
  if (
    typeof manifest.weightMin !== "number" ||
    typeof manifest.weightDefault !== "number" ||
    typeof manifest.weightMax !== "number" ||
    !Number.isInteger(manifest.weightMin) ||
    !Number.isInteger(manifest.weightDefault) ||
    !Number.isInteger(manifest.weightMax) ||
    manifest.weightMin < min ||
    manifest.weightMin > defaultWeight ||
    manifest.weightDefault !== defaultWeight ||
    manifest.weightMax < defaultWeight ||
    manifest.weightMax > max
  ) {
    return invalid("manifest contains an invalid variable weight range");
  }

  if (typeof manifest.publicPath !== "string" || !generatedFontPathPattern.test(manifest.publicPath)) {
    return invalid("manifest publicPath must point to a generated woff2 asset");
  }

  if (manifest.scope === "subset") {
    if (typeof manifest.outputSha256 !== "string" || !sha256Pattern.test(manifest.outputSha256)) {
      return invalid("subset manifest requires a valid outputSha256");
    }

    if (
      typeof manifest.charsetCount !== "number" ||
      !Number.isInteger(manifest.charsetCount) ||
      manifest.charsetCount <= 0
    ) {
      return invalid("subset manifest requires a positive integer charsetCount");
    }
  }

  const filePath = join("public", ...manifest.publicPath.split("/").filter(Boolean));

  if (!existsSync(filePath)) {
    return invalid(`generated font file does not exist at ${filePath}`);
  }

  return { valid: true, asset: manifest as GeneratedFontAsset };
}
