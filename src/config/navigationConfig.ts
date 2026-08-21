import { I18nKey } from "@/i18n/i18nKey";
import { aboutConfig } from "@/config/aboutConfig";

const defaultNavigationConfig = [
  { labelKey: I18nKey.navigationHome, href: "/", icon: "home" },
  { labelKey: I18nKey.navigationPosts, href: "/posts", icon: "article" },
  { labelKey: I18nKey.navigationAbout, href: "/about", icon: "user" },
] as const;

export const navigationConfig = defaultNavigationConfig.filter((item) => item.href !== "/about" || aboutConfig.enabled);
