import { copyFile, mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  assetUrl,
  cachedFontPath,
  fontRelease,
  paths,
  releaseDownloadUrl,
  toPublicUrlPath,
  verifyFileDigest,
} from "./shared.mjs";

const generatedFontPath = `${paths.generated}/MapleMono-CN-Regular-VF.full.${fontRelease.sha256.slice(0, 12)}.woff2`;

async function downloadFile(url, destination) {
  console.log(`Downloading ${assetUrl()}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  await mkdir(dirname(destination), { recursive: true });
  const temporaryPath = `${destination}.tmp`;
  const body = await response.arrayBuffer();
  await writeFile(temporaryPath, Buffer.from(body));
  await rename(temporaryPath, destination);
}

async function ensureCachedFont() {
  const cachedPath = cachedFontPath();

  try {
    await stat(cachedPath);
    await verifyFileDigest(cachedPath, fontRelease.sha256);
    console.log(`Using cached font: ${cachedPath}`);
    return cachedPath;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  await downloadFile(releaseDownloadUrl(), cachedPath);
  await verifyFileDigest(cachedPath, fontRelease.sha256);
  return cachedPath;
}

const cachedPath = await ensureCachedFont();
await rm(paths.generated, { recursive: true, force: true });
await mkdir(dirname(generatedFontPath), { recursive: true });
await copyFile(cachedPath, generatedFontPath);

const manifest = {
  scope: "full",
  tag: fontRelease.tag,
  assetName: fontRelease.assetName,
  sourceSha256: fontRelease.sha256,
  publicPath: toPublicUrlPath(generatedFontPath),
  weightMin: fontRelease.weightAxis.min,
  weightDefault: fontRelease.weightAxis.default,
  weightMax: fontRelease.weightAxis.max,
};

await writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Full development font ready: ${manifest.publicPath}`);
