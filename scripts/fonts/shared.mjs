import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
export const fontRelease = {
  repository: "TeacherLi07/maple-font",
  tag: "custom-cn-narrow-r7",
  assetName: "MapleMono-CN-Narrow-VF.woff2",
  sha256: "a533a0d48c12cbaf2b9f23e83e746ae86271ed757ea27aab0fc3c2e4eb26abd5",
};

export const paths = {
  cache: ".cache/fonts",
  generated: "public/fonts/generated",
  manifest: ".astro/font-asset.json",
};

export function toPublicUrlPath(filePath) {
  const normalizedPath = filePath.replaceAll("\\", "/");

  return `/${normalizedPath.replace(/^public\//, "")}`;
}

export function assetUrl() {
  return `https://github.com/${fontRelease.repository}/releases/download/${fontRelease.tag}/${fontRelease.assetName}`;
}

export function cachedFontPath() {
  return `${paths.cache}/${fontRelease.assetName}`;
}

export function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export async function verifyFileDigest(filePath, expectedSha256) {
  const actualSha256 = await sha256File(filePath);
  if (actualSha256 !== expectedSha256) {
    throw new Error(`SHA256 mismatch for ${filePath}: expected ${expectedSha256}, got ${actualSha256}`);
  }
}

export function releaseDownloadUrl() {
  return `https://github.com/${fontRelease.repository}/releases/download/${fontRelease.tag}/${encodeURIComponent(fontRelease.assetName)}`;
}
