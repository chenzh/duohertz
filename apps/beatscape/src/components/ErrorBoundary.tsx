import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; brand?: "beatscape" | "duohertz" };
type State = { error: Error | null };

/**
 * 全站唯一的错误边界。
 *
 * 改造前项目里一个错误边界都没有：任何一次渲染期抛异常（坏存档数据、缺失的浏览器
 * API、第三方脚本干扰、或者将来某个组件踩到 null）都会让 React 卸载整棵树 ——
 * 用户看到的是一片纯白，连"发生了什么"都无从得知。
 *
 * 放在 Router 外层而不是每个路由各包一个：这里兜的是"整页崩了"的情况，
 * 局部的加载失败（曲库 / 谱面）由页面自己用 error 状态处理。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 保留 componentStack：白屏类问题在真机上很难复现，这行日志通常是唯一线索。
    const standalone = import.meta.env.VITE_DUOHERTZ_PREVIEW === "1"
      || import.meta.env.VITE_DUOHERTZ_RELEASE_SOURCE === "1";
    const brand = standalone ? "duohertz" : this.props.brand ?? "beatscape";
    console.error(`[${brand}] render error:`, error, info.componentStack);
  }

  private reload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    const duohertz = import.meta.env.VITE_DUOHERTZ_PREVIEW === "1"
      || import.meta.env.VITE_DUOHERTZ_RELEASE_SOURCE === "1" || this.props.brand === "duohertz";
    return (
      <section className="dh-state-screen error-screen" role="alert">
        <div className="dh-state-orb" aria-hidden />
        <span className="dh-eyebrow">{duohertz ? "duohertz" : "The Late Static"}</span>
        <h1>Signal lost</h1>
        <p>
          {duohertz ? "duohertz couldn't load this screen. Reload to try again." :
            "BeatScape couldn't load this screen. Reload to try the same page. Your scores are safe."}
        </p>
        <div className="dh-row-center" style={{ gap: 12, marginTop: 8 }}>
          <button type="button" className="dh-btn dh-btn--primary" onClick={this.reload}>
            Reload page
          </button>
          <a className="dh-btn dh-btn--ghost" href={import.meta.env.BASE_URL}>
            Back to home
          </a>
        </div>
      </section>
    );
  }
}
