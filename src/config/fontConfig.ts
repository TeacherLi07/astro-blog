import type { FontConfig } from "@/types/fontConfig";

export const mapleFontFamily = "Maple Mono CN";

export const fontConfig = {
  // 关闭后不再加载 Maple 字体文件，并回退到默认字体栈与默认字重。
  mapleMode: true,

  fonts: {
    maple: {
      font: [
        {
          family: mapleFontFamily,
          src: "/fonts/MapleMono-CN-Regular-VF.woff2",
          weight: "100 800",
        },
        { family: "system-ui" },
      ],
      codeFont: [
        { family: "Maple Mono CN" },
        { family: "Consolas" },
        {
          family: "JetBrains Mono",
          src: "/fonts/JetBrainsMono-Regular.woff2",
          weight: "400",
        },
        { family: "monospace" },
      ],
    },
    fallback: {
      font: [{ family: "system-ui" }],
      codeFont: [
        { family: "Consolas" },
        {
          family: "JetBrains Mono",
          src: "/fonts/JetBrainsMono-Regular.woff2",
          weight: "400",
        },
        { family: "monospace" },
      ],
    },
  },

  weights: {
    maple: {
      body: 330,
      strong: 640,
      heading: 700,
    },
    fallback: {
      body: 400,
      strong: 700,
      heading: 700,
    },
  },

  rendering: {
    bodyFontSize: "1rem",
    bodyLineHeight: 1.9,
    headingLineHeight: 1.45,
    letterSpacing: "0em",
    inlineCodeSize: "0.9em",
    codeFontSize: "0.875rem",
    mapleFeatureSettings: '"calt" 1',
    fallbackFeatureSettings: "normal",
    textRendering: "optimizeLegibility",
    syntheticBold: false,
    syntheticOblique: true,
  },
} as const satisfies FontConfig;
