import type { AboutConfig } from "@/types/aboutConfig";

export const aboutConfig = {
  // 关于页面总开关；关闭后不再生成 /about，导航和头像链接也会隐藏
  enabled: false,

  pageTitle: "关于",
  pageDescription: "关于 TeacherLi",
  hero: {
    eyebrow: "ABOUT TEACHERLI",
    title: "你好，这里是 TeacherLi_。",
    description: ["CS学生", "<?>"],
  },
  // 联系方式图标来自 Iconify：https://icon-sets.iconify.design/。
  // `icon` 使用“图标集前缀:图标名称”；使用新的图标集前缀时，需要安装对应的 @iconify-json/<prefix> 包。
  links: [
    {
      name: "GitHub",
      icon: "fa7-brands:github",
      url: "https://github.com/CnBarrier404/astro-theme-misthaven",
    },
  ],
  techStack: {
    title: "技术栈",
    description: "用于构建和维护 Misthaven 的核心工具。",
    // 图标来自 Iconify：https://icon-sets.iconify.design/。
    // `icon` 使用“图标集前缀:图标名称”；使用新的图标集前缀时，需要安装对应的 @iconify-json/<prefix> 包。
    items: [
      { icon: "devicon:astro", name: "Astro" },
      { icon: "devicon:typescript", name: "TypeScript" },
      { icon: "devicon:tailwindcss", name: "Tailwind CSS" },
    ],
  },
} as const satisfies AboutConfig;
