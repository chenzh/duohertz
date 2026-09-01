import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
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
    console.error("[beatscape] render error:", error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  private goHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <section className="error-screen" role="alert">
        <h1>Signal lost</h1>
        <p className="tagline">Something broke while drawing the Scape. Your scores are safe.</p>
        <pre className="error-detail">{error.message}</pre>
        <div className="cta-row">
          <button type="button" className="btn primary" onClick={this.reset}>
            Try again
          </button>
          <button type="button" className="btn" onClick={this.goHome}>
            Back to home
          </button>
        </div>
      </section>
    );
  }
}
