export interface FontDefinition {
  readonly family: string;
  readonly src?: string;
  readonly weight?: string;
}

export interface FontStack {
  readonly font: readonly FontDefinition[];
  readonly codeFont: readonly FontDefinition[];
}

export interface FontWeightProfile {
  readonly body: number;
  readonly strong: number;
  readonly heading: number;
}

export interface FontRenderingConfig {
  readonly bodyFontSize: string;
  readonly bodyLineHeight: number | string;
  readonly headingLineHeight: number | string;
  readonly letterSpacing: string;
  readonly inlineCodeSize: string;
  readonly codeFontSize: string;
  readonly mapleFeatureSettings: string;
  readonly fallbackFeatureSettings: string;
  readonly textRendering: "auto" | "optimizeSpeed" | "optimizeLegibility" | "geometricPrecision";
  readonly syntheticBold: boolean;
  readonly syntheticOblique: boolean;
}

export interface FontConfig {
  readonly mapleMode: boolean;
  readonly fonts: {
    readonly maple: FontStack;
    readonly fallback: FontStack;
  };
  readonly weights: {
    readonly maple: FontWeightProfile;
    readonly fallback: FontWeightProfile;
  };
  readonly rendering: FontRenderingConfig;
}
