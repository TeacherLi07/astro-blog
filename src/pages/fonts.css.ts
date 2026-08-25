import type { APIRoute } from "astro";

import { fontConfig, mapleFontFamily } from "@/config/fontConfig";
import { getFontFaceCss, resolveFontRuntime } from "@/utils/fonts";

export const GET: APIRoute = () => {
  const fontRuntime = resolveFontRuntime(fontConfig, {
    development: import.meta.env.DEV,
    mapleFontFamily,
  });
  const css = getFontFaceCss([...fontRuntime.stack.font, ...fontRuntime.stack.codeFont]);

  return new Response(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
    },
  });
};
