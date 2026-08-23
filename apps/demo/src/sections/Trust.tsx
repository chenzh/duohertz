import type { LandingContent } from "../content/landing";

export function TrustSection({ content }: { content: LandingContent }) {
  return (
    <section id="trust" className="section trust-section" data-testid="trust-section">
      <h2>{content.trustTitle}</h2>
      <p className="section-lead">{content.trustLead}</p>
      <div className="trust-grid">
        <div className="arch-diagram glass" aria-label="architecture">
          <svg viewBox="0 0 480 200" className="arch-svg">
            <rect x="20" y="70" width="100" height="60" rx="8" className="arch-box" />
            <text x="70" y="105" textAnchor="middle" className="arch-label">
              Browser
            </text>
            <rect x="160" y="70" width="100" height="60" rx="8" className="arch-box accent" />
            <text x="210" y="105" textAnchor="middle" className="arch-label">
              Gateway
            </text>
            <rect x="300" y="30" width="90" height="50" rx="8" className="arch-box vocal" />
            <text x="345" y="60" textAnchor="middle" className="arch-label">
              ACE
            </text>
            <rect x="300" y="110" width="90" height="50" rx="8" className="arch-box game" />
            <text x="345" y="140" textAnchor="middle" className="arch-label">
              SA3
            </text>
            <rect x="410" y="70" width="60" height="60" rx="8" className="arch-box" />
            <text x="440" y="105" textAnchor="middle" className="arch-label">
              MLX
            </text>
            <path d="M120 100 H160 M260 85 H300 M260 115 H300 M390 90 H410 M390 110 H410" className="arch-line" />
          </svg>
        </div>
        <div className="deploy-cards">
          {content.deployCards.map((c) => (
            <article key={c.title} className="deploy-card glass">
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ConvertSection({
  content,
  apiDocsUrl,
  benchmark,
}: {
  content: LandingContent;
  apiDocsUrl: string;
  benchmark?: { ace_vocal_10s_sec?: number; sa3_bgm_30s_sec?: string };
}) {
  return (
    <section id="pricing" className="section convert-section" data-testid="pricing-section">
      <h2>{content.pricingTitle}</h2>
      <p className="section-lead">{content.pricingLead}</p>
      <p className="pricing-demo-note">{content.pricingDemoNote}</p>
      {benchmark && (
        <div className="benchmark-row">
          {benchmark.ace_vocal_10s_sec != null && (
            <span>ACE 10s ≈ {benchmark.ace_vocal_10s_sec}s</span>
          )}
          {benchmark.sa3_bgm_30s_sec && <span>SA3 30s: {benchmark.sa3_bgm_30s_sec}</span>}
        </div>
      )}
      <div className="pricing-grid">
        {content.tiers.map((tier) => (
          <article key={tier.name} className="pricing-card glass">
            <h3>{tier.name}</h3>
            <div className="pricing-price">{tier.price}</div>
            <ul>
              {tier.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="poc-block glass">
        <h3>{content.pocTitle}</h3>
        <ul>
          {content.pocItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <a className="btn-secondary" href={apiDocsUrl} target="_blank" rel="noreferrer">
        {content.convertDocs}
      </a>
    </section>
  );
}
