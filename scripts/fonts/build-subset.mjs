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

async function collectHomeSources() {
  const files = [
    "src/pages/index.astro",
    "src/layouts/BaseLayout.astro",
    "src/components/layout/HomePage.astro",
    "src/components/layout/NavigationBar.astro",
    "src/components/layout/Footer.astro",
    "src/components/content/CommentViewCounts.astro",
    "src/components/content/PostCard.astro",
    "src/components/content/PostList.astro",
    "src/components/ui/PostMeta.astro",
    "src/components/ui/Card.astro",
    "src/components/ui/Hero.astro",
    "src/components/ui/Icon.astro",
    "src/components/ui/PopularTags.astro",
    "src/components/ui/PostSort.astro",
    "src/components/ui/QuoteCard.astro",
    "src/components/ui/SiteStats.astro",
    "src/components/ui/TagList.astro",
    ...userFacingConfigs,
    join("src/i18n/languages", `${await readSiteLanguage()}.ts`),
    "public/site.webmanifest",
  ];

  return [...new Set(files)];
}

async function collectHomePostFrontmatters() {
  const postFiles = await collectPaths("src/content/posts", {
    extensions: new Set([".md"]),
    predicate: (path) => !isSamplePost(path),
  });

  return Promise.all(
    postFiles.map(async (path) => {
      const content = await readFile(path, "utf8");
      return isDraftPost(content) ? "" : getFrontmatter(content);
    }),
  );
}

async function buildCharset(sourceFiles, additionalTexts = []) {
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

  for (const text of additionalTexts) addText(text);

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

function unicodeRange(characters) {
  const codePoints = [...new Set([...characters].map((character) => character.codePointAt(0)))].sort((a, b) => a - b);
  const ranges = [];
  for (const codePoint of codePoints) {
    const previous = ranges.at(-1);
    if (previous && codePoint === previous[1] + 1) previous[1] = codePoint;
    else ranges.push([codePoint, codePoint]);
  }
  return ranges
    .map(([start, end]) => (start === end ? `U+${start.toString(16)}` : `U+${start.toString(16)}-${end.toString(16)}`))
    .join(",");
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
const homeCharset = await buildCharset(await collectHomeSources(), await collectHomePostFrontmatters());
const detectedWeights = await collectVariableWeights();
const weightRange = calculateWeightRange(detectedWeights);
console.log(`Rendered sources: ${sourceFiles.length}`);
console.log(`Detected variable weights: ${detectedWeights.join(", ")}`);
console.log(`Variable axis range: ${weightRange.min}-${weightRange.max}`);
const homeCharsetPath = join(workPath, "home-charset.txt");
await writeFile(homeCharsetPath, homeCharset, "utf8");
const homeOutputPath = join(workPath, "home.woff2");
const homeCoveredPath = join(workPath, "home-covered-charset.txt");
await buildWebfont(sourceFontPath, homeCharsetPath, homeCoveredPath, homeOutputPath, weightRange);
const supportedHomeCharset = await readFile(homeCoveredPath, "utf8");
const homeCharacters = new Set(supportedHomeCharset);
const remainderCharset = [...charset].filter((character) => !homeCharacters.has(character)).join("");
const remainderCharsetPath = join(workPath, "remainder-charset.txt");
await writeFile(remainderCharsetPath, remainderCharset, "utf8");
const remainderOutputPath = join(workPath, "remainder.woff2");
const remainderCoveredPath = join(workPath, "remainder-covered-charset.txt");
await buildWebfont(sourceFontPath, remainderCharsetPath, remainderCoveredPath, remainderOutputPath, weightRange);

async function finalizeAsset(name, temporaryPath, characters) {
  const outputSha256 = await sha256File(temporaryPath);
  const finalOutputPath = `${generatedFontPrefix}.${name}.${outputSha256.slice(0, 12)}.woff2`;
  await mkdir(dirname(finalOutputPath), { recursive: true });
  await rename(temporaryPath, finalOutputPath);
  return {
    scope: "subset",
    tag: fontRelease.tag,
    assetName: fontRelease.assetName,
    sourceSha256: fontRelease.sha256,
    outputSha256,
    charsetCount: characters.length,
    requestedCharsetCount: characters.length,
    publicPath: toPublicUrlPath(finalOutputPath),
    unicodeRange: unicodeRange(characters),
    weightMin: weightRange.min,
    weightDefault: fontRelease.weightAxis.default,
    weightMax: weightRange.max,
  };
}

const homeAsset = await finalizeAsset("home", homeOutputPath, supportedHomeCharset);
const remainderCharsetCovered = await readFile(remainderCoveredPath, "utf8");
const remainderAsset = await finalizeAsset("remainder", remainderOutputPath, remainderCharsetCovered);

const manifest = {
  scope: "subset",
  tag: fontRelease.tag,
  assetName: fontRelease.assetName,
  sourceSha256: fontRelease.sha256,
  assets: { home: homeAsset, remainder: remainderAsset },
  weightMin: weightRange.min,
  weightDefault: fontRelease.weightAxis.default,
  weightMax: weightRange.max,
};

await writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Subset fonts ready: ${homeAsset.publicPath}, ${remainderAsset.publicPath}`);
console.log(`Characters: home ${homeAsset.charsetCount}, remainder ${remainderAsset.charsetCount}`);
