type Props = {
  onRetry: () => void;
};

/** Recoverable, non-blocking catalog failure shared by Home and Library. */
export function CatalogErrorNotice({ onRetry }: Props) {
  return (
    <div className="catalog-error" role="alert">
      <div className="catalog-error-copy">
        <strong>Track list unavailable</strong>
        <span>Check your connection, then try again. Your local scores are safe.</span>
      </div>
      <button type="button" className="btn" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
