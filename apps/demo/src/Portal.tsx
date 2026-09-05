import { useEffect, useRef, useState } from "react";
import type { Locale } from "./i18n";
import { publicAsset } from "./lib/assets";
import { readStoredLocale, writeStorage } from "./lib/storage";
import "./styles/portal.css";

const DOCS = "#api-docs";
const COMPLIANCE = "#licenses";

const copy = {
  zh: {
    skip: "跳到主要内容", products: "产品", create: "音乐 API", about: "使用说明",
    eyebrow: "MUSICSAAS / 音乐与互动体验", title: "让音乐，\n从创作走到体验。",
    intro: "用 API 创作人声与配乐，在 BeatScape 跟随节拍，在 Scape Music 继续聆听。三个入口，连接音乐的不同玩法。",
    explore: "探索产品", docs: "阅读 API 文档", productLead: "选择你的下一站",
    game: "跟着节奏，进入城市的夜晚。", gameBody: "浏览曲库、选择难度，用每一次击打回应音乐。", gameCta: "体验 BeatScape",
    music: "把一首歌，听完整。", musicBody: "发现音乐、浏览歌单，在独立的在线听歌站继续播放。", musicCta: "打开 Scape Music",
    api: "为你的产品，加入音乐创作。", apiBody: "统一 REST API 调度 ACE-Step 人声与 Stable Audio 3 配乐；支持在自有 Apple Silicon 设备上部署推理。",
    modes: ["歌词生成人声", "描述生成人声", "游戏背景音乐", "游戏主题曲"],
    gated: "在线生成面向受邀体验开放。本页可直接浏览产品和集成文档。",
    unavailable: "在线生成试用尚未开放。你可以先查看 API 文档，了解调用方式与部署要求。",
    demo: "进入受邀演示", sampleTitle: "播放兼容性示例 · 5 秒",
    sampleNote: "以下是两段用于检查播放与下载的技术样例，不代表正式作品或模型质量。音乐体验请访问上方产品。",
    bgm: "配乐接口测试片段", vocal: "人声接口测试片段", download: "下载 WAV", failed: "音频暂时无法播放，请重试或下载后播放。", retry: "重试",
    notes: "使用说明", privacy: "本门户不提供账号注册或生成表单；语言偏好仅保存在当前浏览器。访问托管服务会产生常规请求日志。进入其他产品后，以各产品的使用与隐私说明为准。",
    license: "模型许可与使用范围", trial: "产品体验入口已开放；正式发布状态与内容验收以各产品公告为准。",
    footer: "音乐生成 · 节奏游戏 · 在线聆听", language: "语言",
  },
  en: {
    skip: "Skip to content", products: "Products", create: "Music API", about: "About this site",
    eyebrow: "MUSICSAAS / MUSIC & INTERACTIVE EXPERIENCES", title: "From creation\nto connection.",
    intro: "Create vocals and soundtracks with an API. Find your rhythm in BeatScape. Keep listening with Scape Music. Three ways to experience music.",
    explore: "Explore products", docs: "Read the API docs", productLead: "Choose your next stop",
    game: "Step into the rhythm of the city.", gameBody: "Browse tracks, choose a difficulty and play along with every beat.", gameCta: "Play BeatScape",
    music: "Stay for the whole song.", musicBody: "Discover tracks, explore playlists and keep listening in the dedicated music app.", musicCta: "Open Scape Music",
    api: "Bring music creation to your product.", apiBody: "One REST API for ACE-Step vocals and Stable Audio 3 soundtracks, with inference deployable on your own Apple Silicon hardware.",
    modes: ["Vocals from lyrics", "Vocals from a prompt", "Game background music", "Game theme songs"],
    gated: "Online generation is available to invited visitors. Explore the products and integration docs here.",
    unavailable: "Online generation trials are not open yet. Start with the API docs for integration and deployment requirements.",
    demo: "Open invited demo", sampleTitle: "Playback compatibility samples · 5 seconds",
    sampleNote: "These two technical clips check playback and downloads. They are not finished tracks or model quality demonstrations. Visit the products above for music experiences.",
    bgm: "Soundtrack API test clip", vocal: "Vocal API test clip", download: "Download WAV", failed: "Audio is unavailable. Retry or download the clip to play it.", retry: "Retry",
    notes: "About this site", privacy: "This portal has no accounts or generation forms. Your language preference is saved only in this browser. Hosting services receive standard request logs. Other products have their own terms and privacy information.",
    license: "Model licenses & usage", trial: "Product previews are available. See each product for its release status and content review updates.",
    footer: "Music generation · Rhythm games · Listening", language: "Language",
  },
};

function Sample({ kind, locale }: { kind: "bgm" | "vocal"; locale: Locale }) {
  const [failed, setFailed] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const t = copy[locale];
  const src = publicAsset(kind === "bgm" ? "samples/bgm-demo.wav" : "samples/vocal-demo.wav");
  return <article className="portal-sample">
    <h3>{t[kind]}</h3>
    <audio ref={audio} controls preload="none" src={src} aria-label={t[kind]}
      onError={() => setFailed(true)} onCanPlay={() => setFailed(false)}
      onPlay={(event) => { document.querySelectorAll("audio").forEach((el) => { if (el !== event.currentTarget) el.pause(); }); }} />
    {failed && <p role="alert">{t.failed} <button type="button" onClick={() => { setFailed(false); audio.current?.load(); }}>{t.retry}</button></p>}
    <a href={src} download>{t.download}</a>
  </article>;
}

export function Portal() {
  const [locale, setLocale] = useState<Locale>(() => readStoredLocale());
  const t = copy[locale];
  useEffect(() => {
    writeStorage("demo_locale", locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = locale === "zh" ? "MusicSaas · 创作、游戏与聆听" : "MusicSaas · Create, play & listen";
  }, [locale]);

  return <div className="portal">
    <a className="portal-skip" href="#main">{t.skip}</a>
    <header className="portal-header">
      <a className="nav-brand" href="/" aria-label="MusicSaas"><img src={publicAsset("brand/logo.svg")} width="34" height="34" alt="" />MusicSaas</a>
      <nav aria-label={t.products}><a href="#products">{t.products}</a><a href="#create">{t.create}</a></nav>
      <select aria-label={t.language} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}><option value="zh">中文</option><option value="en">EN</option></select>
    </header>
    <main id="main" tabIndex={-1}>
      <section className="portal-hero" aria-labelledby="portal-title">
        <p className="portal-eyebrow">{t.eyebrow}</p>
        <h1 id="portal-title">{t.title}</h1>
        <p className="portal-intro">{t.intro}</p>
        <div className="portal-actions"><a className="portal-primary" href="#products">{t.explore} <span aria-hidden="true">↗</span></a><a href={DOCS}>{t.docs} <span aria-hidden="true">→</span></a></div>
        <div className="portal-signal" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} />)}</div>
      </section>
      <section id="products" className="portal-section" aria-labelledby="products-title">
        <p className="portal-eyebrow">01 / {t.products}</p><h2 id="products-title">{t.productLead}</h2>
        <div className="portal-products">
          <article className="portal-product portal-game"><p className="portal-product-name">BEATSCAPE</p><h3>{t.game}</h3><p>{t.gameBody}</p><a href="https://beatscape.pages.dev/">{t.gameCta}<span aria-hidden="true">↗</span></a></article>
          <article className="portal-product portal-music"><p className="portal-product-name">SCAPE MUSIC</p><h3>{t.music}</h3><p>{t.musicBody}</p><a href="https://scapemusic.pages.dev/">{t.musicCta}<span aria-hidden="true">↗</span></a></article>
        </div>
        <p className="portal-note">{t.trial}</p>
      </section>
      <section id="create" className="portal-section portal-create" aria-labelledby="create-title">
        <div><p className="portal-eyebrow">02 / MUSIC API</p><h2 id="create-title">{t.api}</h2><p>{t.apiBody}</p><ul>{t.modes.map((mode) => <li key={mode}>{mode}</li>)}</ul></div>
        <aside className="portal-access"><span className="portal-eyebrow">DEVELOPER ACCESS</span><p>{__PORTAL_DEMO_URL__ ? t.gated : t.unavailable}</p><a className="portal-primary" href={DOCS}>{t.docs} →</a>{__PORTAL_DEMO_URL__ && <a href={__PORTAL_DEMO_URL__}>{t.demo} ↗</a>}</aside>
      </section>
      <section id="api-docs" className="portal-section portal-docs" aria-labelledby="docs-title">
        <p className="portal-eyebrow">03 / DEVELOPER GUIDE</p><h2 id="docs-title">{locale === "zh" ? "API 集成速查" : "API quick start"}</h2>
        <p>{locale === "zh" ? "先取得受邀服务地址与 API 密钥，或在自有环境部署 Gateway 与 Worker。以下请求在你的服务端运行；密钥只保留在服务端环境变量中。本站不接收生成请求。" : "Obtain an invited service endpoint and API key, or deploy the Gateway and workers in your own environment. Run these requests on your server and keep the key in server environment variables. This portal does not accept generation requests."}</p>
        <ol><li><code>POST /v1/jobs</code> — {locale === "zh" ? "提交参数，返回 data.job_id（HTTP 201）。" : "Submit parameters and receive data.job_id (HTTP 201)."}</li><li><code>GET /v1/jobs/:id</code> — {locale === "zh" ? "每 2 秒查询状态，completed 或 failed 时停止，10 分钟后结束等待。" : "Poll every two seconds; stop at completed or failed, or after ten minutes."}</li><li><code>GET /v1/jobs/:id/audio</code> — {locale === "zh" ? "完成后用同一密钥下载 WAV；未完成返回 409。" : "Download the WAV with the same key once complete; pending audio returns 409."}</li></ol>
        <pre><code>{`curl "$MUSIC_API_BASE/v1/jobs" \\\n  -H "X-API-Key: $MUSIC_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  --data '{"mode":"game_bgm","prompt":"gentle piano, instrumental","duration_sec":30}'`}</code></pre>
        <div className="portal-table-wrap"><table><caption>{locale === "zh" ? "生成模式与必填参数" : "Modes and required parameters"}</caption><thead><tr><th>mode</th><th>{locale === "zh" ? "参数" : "Parameters"}</th><th>{locale === "zh" ? "时长（秒）" : "Duration (s)"}</th></tr></thead><tbody><tr><td><code>game_bgm</code></td><td>prompt</td><td>15–180</td></tr><tr><td><code>vocal_desc</code></td><td>prompt</td><td>30–240</td></tr><tr><td><code>vocal_lyrics</code></td><td>style_tags + lyrics</td><td>30–240</td></tr><tr><td><code>game_theme_vocal</code></td><td>prompt / lyrics</td><td>30–240</td></tr></tbody></table></div>
        <p>{locale === "zh" ? "成功响应位于 data；HTTP 请求错误位于 error.code 和 error.message，已创建任务的执行失败位于 data.error。400：参数无效；401：密钥无效；404：任务不存在或无权访问；429：超出限流或日额度，请稍后重试。任务只对创建它的密钥可见。" : "Success responses use data; HTTP request errors use error.code and error.message, and failed jobs include data.error. 400: invalid input; 401: invalid key; 404: missing or inaccessible job; 429: request or daily quota exceeded, retry later. Jobs are visible only to the key that created them."}</p>
      </section>
      <details className="portal-samples"><summary>{t.sampleTitle}</summary><p>{t.sampleNote}</p><div className="portal-sample-grid"><Sample kind="bgm" locale={locale} /><Sample kind="vocal" locale={locale} /></div></details>
      <section id="about" className="portal-section portal-about" aria-labelledby="about-title"><h2 id="about-title">{t.notes}</h2><p>{t.privacy}</p><a href={COMPLIANCE}>{t.license} ↗</a></section>
      <section id="licenses" className="portal-section portal-about" aria-labelledby="licenses-title"><h2 id="licenses-title">{t.license}</h2><p>{locale === "zh" ? "部署模型或使用生成内容前，请阅读对应模型的当前许可与使用条件。此处提供原文入口，不作无条件商用或内容权利保证。" : "Before deploying models or using generated content, read the current model licenses and usage conditions. These links provide the original terms, not an unconditional commercial-use or content-rights guarantee."}</p><ul><li><a href="https://github.com/ace-step/ACE-Step-1.5/blob/main/LICENSE">ACE-Step 1.5 — License</a></li><li><a href="https://huggingface.co/stabilityai/stable-audio-3-medium/blob/main/LICENSE.md">Stable Audio 3 — License</a></li></ul></section>
    </main>
    <footer className="portal-footer"><strong>MusicSaas</strong><span>{t.footer}</span><a href="#about">{t.about}</a></footer>
  </div>;
}
