/**
 * 骨架屏（D 档）。
 *
 * 曲库有 85 首，catalog.json 到手前 Library 是一个空 grid —— 改造前这里会
 * 闪一句 "No tracks match your filters."（因为 Library 根本没解构 `loading`，
 * `filtered.length === 0` 在加载期同样成立）。骨架屏既挡掉了这句误导文案，
 * 也让布局不跳：骨架行复刻 .track-card 的 72px 封面 + 三行文本结构，
 * 真实卡片替换进来时尺寸一致，CLS ≈ 0。
 *
 * 刻意不复用 `.track-card` 类名：Library 的滚动揭示是按 `.track-card` 选择器
 * 扫描的（router.Link 不透传 props，挂不上 data-reveal），骨架若命中该选择器
 * 就会被 IntersectionObserver 加 `.reveal-armed`（opacity:0）再揭示一次，
 * 和骨架自己的淡入打架。所以这里用 `.skeleton-card` 并在 CSS 里复刻盒模型。
 *
 * 动效只做一条横向扫光（RES ONANCE 扁平，不用脉冲/呼吸这类"发光"语言）；
 * prefers-reduced-motion 下退化为静态色块。
 */

type TrackCardSkeletonProps = {
  /** 错峰延迟，让整屏像"逐张翻牌"而不是一起闪。 */
  delayMs?: number;
};

export function TrackCardSkeleton({ delayMs = 0 }: TrackCardSkeletonProps) {
  return (
    <div className="skeleton-card" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <div className="skeleton-block skeleton-cover" />
      <div className="skeleton-lines">
        <div className="skeleton-block skeleton-line skeleton-line-lg" />
        <div className="skeleton-block skeleton-line" />
        <div className="skeleton-block skeleton-line skeleton-line-sm" />
      </div>
    </div>
  );
}

export function TrackGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="track-grid" role="status" aria-live="polite" aria-label="Loading track list">
      {Array.from({ length: count }, (_, i) => (
        <TrackCardSkeleton key={i} delayMs={(i % 4) * 55} />
      ))}
    </div>
  );
}
