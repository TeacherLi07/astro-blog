import type { FontConfig, FontDefinition, FontStack, FontWeightProfile } from "@/types/fontConfig";
import { readGeneratedFontAsset } from "@/utils/fontAsset";

type FontSource = FontDefinition & { readonly src: string };

export type FontRuntime = {
  readonly stack: FontStack;
  readonly useMapleStyles: boolean;
};

export type ResolveFontRuntimeOptions = {
  readonly development: boolean;
  readonly mapleFontFamily: string;
};

function getFontSources(fonts: readonly FontDefinition[]): FontSource[] {
  return fonts.filter((font): font is FontSource => Boolean(font.src?.trim()));
}

function uniqueFontSources(fonts: readonly FontDefinition[]): FontSource[] {
  const seen = new Set<string>();

  return getFontSources(fonts).filter((font) => {
    const key = JSON.stringify([font.family, font.src, font.weight, font.unicodeRange]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cssFamilyName(family: string) {
  return family.includes(" ") ? JSON.stringify(family) : family;
}

export function getFontFamily(fonts: readonly FontDefinition[]) {
  return fonts.map(({ family }) => cssFamilyName(family)).join(", ");
}

export function getFontFaceCss(fonts: readonly FontDefinition[]) {
  return uniqueFontSources(fonts)
    .map(
      ({ family, src, weight = "100 900", unicodeRange }) =>
        `@font-face{font-family:${JSON.stringify(family)};src:url(${JSON.stringify(src)});font-weight:${weight};font-style:normal;font-display:swap${unicodeRange ? `;unicode-range:${unicodeRange}` : ""}}`,
    )
    .join("\n");
}

export function getActiveFontStack(config: FontConfig, useMapleStyles = config.mapleMode): FontStack {
  return config.mapleMode && useMapleStyles ? config.fonts.maple : config.fonts.fallback;
}

export function getActiveWeightProfile(config: FontConfig, useMapleStyles = config.mapleMode): FontWeightProfile {
  return config.mapleMode && useMapleStyles ? config.weights.maple : config.weights.fallback;
}

export function resolveFontRuntime(config: FontConfig, options: ResolveFontRuntimeOptions): FontRuntime {
  if (!config.mapleMode) {
    return { stack: config.fonts.fallback, useMapleStyles: false };
  }

  const assetResult = readGeneratedFontAsset();

  if (!assetResult.valid) {
    const message = `Maple font is enabled but unavailable: ${assetResult.reason}`;

    if (options.development) throw new Error(message);

    console.warn(`[font] ${message}; falling back to the configured fallback fonts.`);
    return { stack: config.fonts.fallback, useMapleStyles: false };
  }

  const generatedFontWeight = `${assetResult.asset.weightMin} ${assetResult.asset.weightMax}`;
  const generatedFonts = assetResult.asset.assets
    ? [assetResult.asset.assets.home, assetResult.asset.assets.remainder]
    : [assetResult.asset];

  function resolveGeneratedSource(font: FontDefinition): FontDefinition[] {
    return font.family === options.mapleFontFamily && font.src?.trim()
      ? generatedFonts.map(({ publicPath, unicodeRange }) => ({
          ...font,
          src: publicPath,
          weight: generatedFontWeight,
          unicodeRange,
        }))
      : [font];
  }

  return {
    stack: {
      font: config.fonts.maple.font.flatMap(resolveGeneratedSource),
      codeFont: config.fonts.maple.codeFont.flatMap(resolveGeneratedSource),
    },
    useMapleStyles: true,
  };
}

export function getFontVariables(config: FontConfig, useMapleStyles = config.mapleMode) {
  const stack = getActiveFontStack(config, useMapleStyles);
  const weights = getActiveWeightProfile(config, useMapleStyles);
  const { rendering } = config;
  const featureSettings =
    config.mapleMode && useMapleStyles ? rendering.mapleFeatureSettings : rendering.fallbackFeatureSettings;

  return [
    ["--font-family", getFontFamily(stack.font)],
    ["--code-font-family", getFontFamily(stack.codeFont)],
    ["--font-body-weight", String(weights.body)],
    ["--font-strong-weight", String(weights.strong)],
    ["--font-heading-weight", String(weights.heading)],
    ["--font-body-size", rendering.bodyFontSize],
    ["--font-body-line-height", String(rendering.bodyLineHeight)],
    ["--font-heading-line-height", String(rendering.headingLineHeight)],
    ["--font-letter-spacing", rendering.letterSpacing],
    ["--font-inline-code-size", rendering.inlineCodeSize],
    ["--font-code-size", rendering.codeFontSize],
    ["--font-feature-settings", featureSettings],
  ] as const;
}

export function getFontStyle(config: FontConfig, useMapleStyles = config.mapleMode) {
  const { rendering } = config;
  const featureSettings =
    config.mapleMode && useMapleStyles ? rendering.mapleFeatureSettings : rendering.fallbackFeatureSettings;

  return [
    ...getFontVariables(config, useMapleStyles).map(([name, value]) => `${name}: ${value}`),
    `font-feature-settings: ${featureSettings}`,
    `font-synthesis-weight: ${rendering.syntheticBold ? "auto" : "none"}`,
    `font-synthesis-style: ${rendering.syntheticOblique ? "auto" : "none"}`,
    `text-rendering: ${rendering.textRendering}`,
  ].join("; ");
}

export function getFontPreconnects(fonts: readonly FontDefinition[]) {
  return [
    ...new Set(
      getFontSources(fonts)
        .map(({ src }) => {
          if (!/^https?:\/\//.test(src)) return null;
          return new URL(src).origin;
        })
        .filter((origin): origin is string => Boolean(origin)),
    ),
  ];
}
