import type { Locale } from "../i18n";

export type LandingContent = {
  navProduct: string;
  navShowcase: string;
  navPlayground: string;
  navPricing: string;
  navDocs: string;
  ctaTry: string;
  heroTitle: string;
  heroSubtitle: string;
  heroListen: string;
  pillars: { title: string; body: string }[];
  stats: { label: string; value: string }[];
  showcaseTitle: string;
  showcaseLead: string;
  trustTitle: string;
  trustLead: string;
  deployCards: { title: string; body: string }[];
  pricingTitle: string;
  pricingLead: string;
  pricingDemoNote: string;
  tiers: { name: string; price: string; features: string[] }[];
  pocTitle: string;
  pocItems: string[];
  convertDocs: string;
  presentHint: string;
  onboardingSteps: { title: string; body: string }[];
};

const zh: LandingContent = {
  navProduct: "产品",
  navShowcase: "精选",
  navPlayground: "体验",
  navPricing: "定价预览",
  navDocs: "文档",
  ctaTry: "立即体验",
  heroTitle: "本地双引擎音乐 API",
  heroSubtitle: "人声 ACE-Step · 游戏 BGM Stable Audio 3 · 推理在自有 Mac，数据不出内网",
  heroListen: "30 秒精选试听",
  pillars: [
    { title: "双引擎分工", body: "人声与 BGM 各用最优模型，API 统一调度" },
    { title: "数据在本地", body: "Gateway + Worker 私有化部署，无云端上传" },
    { title: "分钟级集成", body: "REST + 示例代码，Demo 即集成参考" },
  ],
  stats: [
    { label: "ACE 人声 10s", value: "~3s" },
    { label: "引擎", value: "ACE + SA3" },
    { label: "部署", value: "Mac MLX" },
  ],
  showcaseTitle: "场景橱窗",
  showcaseLead: "无需生成，点选即可试听精选作品",
  trustTitle: "架构与信任",
  trustLead: "从浏览器到 MLX 推理的完整链路",
  deployCards: [
    { title: "Mac MLX", body: "Apple Silicon 本地推理，当前主推形态" },
    { title: "Docker", body: "Gateway + Worker 容器化（规划中）" },
    { title: "私有云", body: "内网 Gateway，Worker 节点可横向扩展" },
  ],
  pricingTitle: "定价预览",
  pricingLead: "商用 SaaS 后续上线；当前 Demo 完全免费",
  pricingDemoNote: "本演示不计费、不收集账号",
  tiers: [
    { name: "Developer", price: "免费试用", features: ["API 沙盒", "社区支持", "本地部署文档"] },
    { name: "Team", price: "联系销售", features: ["多节点 Worker", "SLA 草案", "PoC 陪跑"] },
    { name: "Enterprise", price: "定制", features: ["专属合规评审", "私有化交付", "定制模型路由"] },
  ],
  pocTitle: "PoC 清单（约 2 周）",
  pocItems: [
    "Mac M 系列 + 16GB+ 内存",
    "内网可访问 Gateway :8080",
    "跑通人声 + BGM 各 1 条验收",
    "集成方完成 cURL / Python 调用",
  ],
  convertDocs: "查看 API 文档",
  presentHint: "按 P 显示讲稿备注 · ←/→ 切换步骤",
  onboardingSteps: [
    { title: "听精选", body: "在橱窗点选卡片即可试听" },
    { title: "选预设", body: "进入体验区，一键填充场景参数" },
    { title: "看集成", body: "生成后展开集成面板复制 API 示例" },
  ],
};

const en: LandingContent = {
  navProduct: "Product",
  navShowcase: "Showcase",
  navPlayground: "Playground",
  navPricing: "Pricing",
  navDocs: "Docs",
  ctaTry: "Try now",
  heroTitle: "Local dual-engine music API",
  heroSubtitle: "ACE-Step vocals · Stable Audio 3 BGM · inference on your Mac, data stays on-prem",
  heroListen: "30s featured preview",
  pillars: [
    { title: "Dual engines", body: "Best model per task behind one REST API" },
    { title: "On-prem data", body: "Gateway + workers in your network" },
    { title: "Fast integration", body: "Demo mirrors production BFF flow" },
  ],
  stats: [
    { label: "ACE vocal 10s", value: "~3s" },
    { label: "Engines", value: "ACE + SA3" },
    { label: "Deploy", value: "Mac MLX" },
  ],
  showcaseTitle: "Showcase",
  showcaseLead: "Listen to curated samples — no generation required",
  trustTitle: "Architecture & trust",
  trustLead: "Browser → Gateway → Workers → MLX",
  deployCards: [
    { title: "Mac MLX", body: "Apple Silicon local inference (primary)" },
    { title: "Docker", body: "Containerized gateway + workers (planned)" },
    { title: "Private cloud", body: "Horizontally scaled worker nodes" },
  ],
  pricingTitle: "Pricing preview",
  pricingLead: "Commercial SaaS coming later — Demo is free",
  pricingDemoNote: "No billing or accounts in this demo",
  tiers: [
    { name: "Developer", price: "Free trial", features: ["API sandbox", "Community", "Deploy docs"] },
    { name: "Team", price: "Contact sales", features: ["Multi-worker", "SLA draft", "PoC support"] },
    { name: "Enterprise", price: "Custom", features: ["Compliance review", "Private delivery", "Custom routing"] },
  ],
  pocTitle: "PoC checklist (~2 weeks)",
  pocItems: [
    "Mac M-series, 16GB+ RAM",
    "Gateway :8080 reachable on LAN",
    "One vocal + one BGM acceptance pass",
    "Integrator runs cURL / Python sample",
  ],
  convertDocs: "API documentation",
  presentHint: "Press P for notes · ←/→ for steps",
  onboardingSteps: [
    { title: "Listen", body: "Play cards in the showcase" },
    { title: "Preset", body: "Fill the form with one click" },
    { title: "Integrate", body: "Copy API snippets after generation" },
  ],
};

export function useLandingContent(locale: Locale): LandingContent {
  return locale === "zh" ? zh : en;
}
