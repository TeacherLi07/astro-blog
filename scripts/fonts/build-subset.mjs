import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
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
const renderedCodeExtensions = new Set([".astro", ".css", ".mjs", ".ts", ".tsx"]);
const userFacingConfigs = [
  "src/config/aboutConfig.ts",
  "src/config/commentConfig.ts",
  "src/config/footerConfig.ts",
  "src/config/navigationConfig.ts",
  "src/config/postConfig.ts",
  "src/config/siteConfig.ts",
];

async function collectPaths(root, { extensions, predicate } = {}) {
  const files = [];
  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPaths(entryPath, { extensions, predicate })));
    } else if (
      entry.isFile() &&
      (!extensions || extensions.has(entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase()))
    ) {
      files.push(entryPath);
    }
  }

  const filtered = predicate ? files.filter(predicate) : files;
  return filtered.sort();
}

function getFrontmatter(content) {
  return content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
}

function isDraftPost(content) {
  return /^draft:\s*true(?:\s|#|$)/im.test(getFrontmatter(content));
}

function isSamplePost(path) {
  return path
    .replaceAll("\\", "/")
    .split("/")
    .some((segment) => segment.startsWith("_"));
}

function extractQuotedStrings(content) {
  return (content.match(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g) ?? []).map((literal) =>
    literal.slice(1, -1),
  );
}

function toPosix(path) {
  return isAbsolute(path) ? path.replaceAll("\\", "/") : path;
}

async function readSiteLanguage() {
  const siteConfig = await readFile("src/config/siteConfig.ts", "utf8");
  const language = siteConfig.match(/^\s*lang:\s*"([^"]+)"/m)?.[1];

  if (!language) throw new Error("Unable to determine siteConfig.lang");
  return language;
}

async function isOptionEnabled(path, option) {
  const content = await readFile(path, "utf8");
  return new RegExp(`^\\s*${option}:\\s*true,?$`, "m").test(content);
}

async function collectRenderedSources() {
  const files = [];
  const renderedDirectories = ["src/components", "src/layouts", "src/pages", "src/scripts", "src/styles"];

  for (const directory of renderedDirectories) {
    files.push(...(await collectPaths(directory, { extensions: renderedCodeExtensions })));
  }

  files.push(...userFacingConfigs);
  files.push("src/integrations/markdownCallout/index.ts");

  const language = await readSiteLanguage();
  files.push(join("src/i18n/languages", `${language}.ts`));

  const postFiles = await collectPaths("src/content/posts", {
    extensions: new Set([".md"]),
    predicate: (path) => !isSamplePost(path),
  });

  for (const path of postFiles) {
    const content = await readFile(path, "utf8");
    if (!isDraftPost(content)) files.push(path);
  }

  files.push(...(await collectPaths("src/content/pages", { extensions: new Set([".md"]) })));
  files.push("public/site.webmanifest");

  if (await isOptionEnabled("src/config/siteConfig.ts", "enableMarkdownNegotiation")) {
    files.push("src/integrations/markdownForAgents/generate.mjs");
  }

  if (await isOptionEnabled("src/config/commentConfig.ts", "enabled")) {
    // Include the bundled UI strings so enabling comments does not require a font
    // source audit beyond changing this configuration flag.
    files.push("node_modules/artalk/dist/Artalk.js");
  }

  return [...new Set(files)].sort();
}

async function buildCharset(sourceFiles) {
  const characters = new Set();
  for (let codePoint = 0x20; codePoint <= 0x7e; codePoint += 1) {
    characters.add(String.fromCodePoint(codePoint));
  }

  for (const character of "‘’“”‚„‹›«»–—…‣•·°×÷，。、；：？！「」『』（）《》〈〉【】〔〕～￥$€£¥¢±≈≠≤≥√") {
    characters.add(character);
  }

  const addText = (text) => {
    for (const character of text.normalize("NFC")) {
      const codePoint = character.codePointAt(0);
      if (codePoint >= 0x20 && codePoint !== 0x7f && !(codePoint >= 0xd800 && codePoint <= 0xdfff)) {
        characters.add(character);
      }
    }
  };

  for (const filePath of sourceFiles) {
    const content = await readFile(filePath, "utf8");
    const normalizedPath = toPosix(filePath);

    if (normalizedPath.endsWith(".webmanifest")) {
      addText(extractQuotedStrings(content).join(""));
      continue;
    }

    if (userFacingConfigs.includes(normalizedPath) || normalizedPath.endsWith(`${await readSiteLanguage()}.ts`)) {
      addText(extractQuotedStrings(content).join(""));
      continue;
    }

    if (normalizedPath.endsWith("markdownCallout/index.ts")) {
      addText(extractQuotedStrings(content).join(""));
      continue;
    }

    addText(content);
  }

  return [...characters].join("");
}

function parseMapleWeights(content) {
  const mapleWeights = content.match(/weights:\s*{\s*maple:\s*{([\s\S]*?)}/)?.[1];
  if (!mapleWeights) throw new Error("Unable to find weights.maple in fontConfig");

  const weights = {};
  for (const name of ["body", "strong", "heading"]) {
    const value = mapleWeights.match(new RegExp(`\\b${name}:\\s*(\\d+)`))?.[1];
    if (!value) throw new Error(`Unable to find weights.maple.${name}`);
    weights[name] = Number(value);
  }

  return weights;
}

async function collectVariableWeights() {
  const tailwindWeights = {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  };
  const namedWeights = { normal: 400, bold: 700 };
  const detected = new Set([fontRelease.weightAxis.default]);

  const addWeight = (value) => {
    const weight = Number(value);
    if (Number.isInteger(weight) && weight >= 1 && weight <= 1000) {
      detected.add(Math.min(Math.max(weight, fontRelease.weightAxis.min), fontRelease.weightAxis.max));
    }
  };

  const fontConfig = await readFile("src/config/fontConfig.ts", "utf8");
  Object.values(parseMapleWeights(fontConfig)).forEach(addWeight);

  const sourceFiles = await collectRenderedSources();
  sourceFiles.push("src/config/fontConfig.ts", "src/config/expressiveCodeConfig.ts", "src/utils/ogImage.ts");

  for (const filePath of [...new Set(sourceFiles)]) {
    const content = await readFile(filePath, "utf8");

    for (const [, value] of content.matchAll(/font-weight\s*[=:]\s*["']?(\d{1,4})/gi)) addWeight(value);
    for (const [, value] of content.matchAll(/fontWeight\s*:\s*["']?(\d{1,4})/gi)) addWeight(value);
    for (const [, value] of content.matchAll(/font-\[(\d{1,4})\]/gi)) addWeight(value);
    for (const [, value] of content.matchAll(/font-weight\s*:\s*(normal|bold)/gi))
      addWeight(namedWeights[value.toLowerCase()]);
    for (const [, value] of content.matchAll(/fontWeight\s*:\s*["'](normal|bold)["']/gi)) {
      addWeight(namedWeights[value.toLowerCase()]);
    }
    for (const [, value] of content.matchAll(
      /(?:^|[^A-Za-z0-9_-])font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)(?![A-Za-z0-9_-])/g,
    )) {
      addWeight(tailwindWeights[value]);
    }
  }

  // Expressive Code injects its own UI styles after source scanning. These are the two
  // packages whose generated styles can render text with the site's mono font stack.
  const expressiveCodeSources = [
    "node_modules/@expressive-code/core/dist/index.js",
    "node_modules/@expressive-code/plugin-frames/dist/index.js",
  ];

  const expressiveCodeConfig = await readFile("src/config/expressiveCodeConfig.ts", "utf8");
  if (/pluginCollapsible:\s*{[\s\S]*?enable:\s*true/.test(expressiveCodeConfig)) {
    expressiveCodeSources.push("node_modules/expressive-code-collapsible/dist/index.js");
  }

  for (const filePath of expressiveCodeSources) {
    try {
      const content = await readFile(filePath, "utf8");
      for (const [, value] of content.matchAll(/font-weight:\s*(\d{1,4})/g)) addWeight(value);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  if (await isOptionEnabled("src/config/commentConfig.ts", "enabled")) {
    try {
      const artalkCss = await readFile("node_modules/artalk/dist/Artalk.css", "utf8");
      for (const [, value] of artalkCss.matchAll(/font-weight:\s*(\d{1,4})/g)) addWeight(value);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  return [...detected].sort((left, right) => left - right);
}

function calculateWeightRange(detectedWeights) {
  const min = Math.min(...detectedWeights, fontRelease.weightAxis.default);
  const max = Math.max(...detectedWeights, fontRelease.weightAxis.default);

  if (min < fontRelease.weightAxis.min || max > fontRelease.weightAxis.max) {
    throw new Error(`Detected weights exceed the source axis: ${min}-${max}`);
  }

  return { min, max };
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

async function buildWebfont(sourceFontPath, charsetPath, coveredCharsetPath, outputPath, weightRange) {
  const result = spawnSync(
    "uv",
    [
      "run",
      "--project",
      pythonProject,
      "--locked",
      "--no-dev",
      "python",
      "scripts/fonts/build-webfont.py",
      sourceFontPath,
      charsetPath,
      outputPath,
      coveredCharsetPath,
      String(weightRange.min),
      String(weightRange.max),
    ],
    {
      stdio: "inherit",
      env: { ...process.env, UV_CACHE_DIR: ".cache/uv" },
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`build-webfont.py exited with status ${result.status}`);
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
const sourceFiles = await collectRenderedSources();
const charset = await buildCharset(sourceFiles);
const detectedWeights = await collectVariableWeights();
const weightRange = calculateWeightRange(detectedWeights);
console.log(`Rendered sources: ${sourceFiles.length}`);
console.log(`Detected variable weights: ${detectedWeights.join(", ")}`);
console.log(`Variable axis range: ${weightRange.min}-${weightRange.max}`);
const charsetPath = join(workPath, "charset.txt");
await writeFile(charsetPath, charset, "utf8");
const coveredCharsetPath = join(workPath, "covered-charset.txt");

const temporaryOutputPath = join(workPath, "subset.woff2");
await buildWebfont(sourceFontPath, charsetPath, coveredCharsetPath, temporaryOutputPath, weightRange);

const supportedCharset = await readFile(coveredCharsetPath, "utf8");

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
  charsetCount: supportedCharset.length,
  requestedCharsetCount: charset.length,
  publicPath: toPublicUrlPath(finalOutputPath),
  weightMin: weightRange.min,
  weightDefault: fontRelease.weightAxis.default,
  weightMax: weightRange.max,
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
    coveredCharsetPath,
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
