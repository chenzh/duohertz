import type { Messages } from "../i18n";

type Props = {
  message: string;
  code?: string;
  onRetry?: () => void;
  t: Messages;
};

export function ErrorBanner({ message, code, onRetry, t }: Props) {
  return (
    <div className="error-banner" role="alert">
      <div>
        {code && <strong className="error-code">{code}</strong>}
        <p>{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          {t.retry}
        </button>
      )}
    </div>
  );
}

export function OfflineBanner({ message }: { message: string }) {
  return (
    <div className="offline-banner" role="status">
      <span className="offline-dot">●</span>
      {message}
    </div>
  );
}
