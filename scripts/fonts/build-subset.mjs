import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

import {
  assetUrl,
  cachedFontPath,
  fontRelease,
  paths,
  releaseDownloadUrl,
  sha256File,
  toPublicUrlPath,
  verifyFileDigest,
} from "./shared.mjs";

const pythonProject = "scripts/fonts";
const generatedFontPrefix = `${paths.generated}/MapleMono-CN-Regular-VF.subset`;
const textFileExtensions = new Set([".astro", ".css", ".js", ".json", ".md", ".mdx", ".mjs", ".ts", ".tsx"]);

async function collectPaths(root) {
  const files = [];
  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPaths(entryPath)));
    } else if (textFileExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

async function buildCharset() {
  const characters = new Set();
  for (let codePoint = 0x20; codePoint <= 0x7e; codePoint += 1) {
    characters.add(String.fromCodePoint(codePoint));
  }

  for (const character of "‘’“”‚„‹›«»–—…‣•·°×÷，。、；：？！「」『』（）《》〈〉【】〔〕～￥$€£¥¢±≈≠≤≥√") {
    characters.add(character);
  }

  for (const filePath of await collectPaths("src")) {
    const content = (await readFile(filePath, "utf8")).normalize("NFC");
    for (const character of content) {
      const codePoint = character.codePointAt(0);
      if (codePoint >= 0x20 && codePoint !== 0x7f && !(codePoint >= 0xd800 && codePoint <= 0xdfff)) {
        characters.add(character);
      }
    }
  }

  return [...characters].join("");
}

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

async function ensureSourceFont() {
  const cachedPath = cachedFontPath();

  try {
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

async function subsetFont(sourceFontPath, charsetPath, outputPath) {
  const result = spawnSync(
    "uv",
    [
      "run",
      "--project",
      pythonProject,
      "--locked",
      "--no-dev",
      "python",
      "-m",
      "fontTools.subset",
      sourceFontPath,
      `--text-file=${charsetPath}`,
      "--flavor=woff2",
      "--layout-features=calt,ccmp,locl,kern,mark,mkmk,liga,rlig",
      "--name-IDs=1,2,3,4,6,16,17",
      "--name-languages=*",
      "--notdef-outline",
      "--recommended-glyphs",
      "--drop-tables+=DSIG,BASE,meta,vhea,vmtx,VVAR",
      `--output-file=${outputPath}`,
    ],
    {
      stdio: "inherit",
      env: { ...process.env, UV_CACHE_DIR: ".cache/uv" },
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`fontTools.subset exited with status ${result.status}`);
  }
}

await rm(paths.generated, { recursive: true, force: true });
await mkdir(paths.generated, { recursive: true });
await mkdir(paths.cache, { recursive: true });
await mkdir(".astro", { recursive: true });

const workPath = join(paths.cache, "subset-work");
await rm(workPath, { recursive: true, force: true });
await mkdir(workPath, { recursive: true });

const sourceFontPath = await ensureSourceFont();
const charset = await buildCharset();
const charsetPath = join(workPath, "charset.txt");
await writeFile(charsetPath, charset, "utf8");

const temporaryOutputPath = join(workPath, "subset.woff2");
await subsetFont(sourceFontPath, charsetPath, temporaryOutputPath);

const outputSha256 = await sha256File(temporaryOutputPath);
const shortOutputSha256 = outputSha256.slice(0, 12);
const finalOutputPath = `${generatedFontPrefix}.${shortOutputSha256}.woff2`;
await mkdir(dirname(finalOutputPath), { recursive: true });
await rename(temporaryOutputPath, finalOutputPath);

const manifest = {
  scope: "subset",
  tag: fontRelease.tag,
  assetName: fontRelease.assetName,
  sourceSha256: fontRelease.sha256,
  outputSha256,
  charsetCount: charset.length,
  publicPath: toPublicUrlPath(finalOutputPath),
};

await writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
const validationResult = spawnSync(
  "uv",
  [
    "run",
    "--project",
    pythonProject,
    "--locked",
    "--no-dev",
    "python",
    "scripts/fonts/validate-subset.py",
    paths.manifest,
    charsetPath,
  ],
  {
    stdio: "inherit",
    env: { ...process.env, UV_CACHE_DIR: ".cache/uv" },
  },
);

if (validationResult.error) throw validationResult.error;
if (validationResult.status !== 0) {
  throw new Error(`Subset validation exited with status ${validationResult.status}`);
}

console.log(`Subset font ready: ${manifest.publicPath}`);
console.log(`Characters: ${manifest.charsetCount}; output SHA256: ${outputSha256}`);
