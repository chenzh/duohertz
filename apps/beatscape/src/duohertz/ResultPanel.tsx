import { useEffect, useRef } from "react";
import { Link } from "../router";
import type { DuohertzSession } from "./session";
import type { DuohertzTier } from "./chart";
import "./result-panel.css";

type Result = ReturnType<DuohertzSession["result"]>;
type KeyResult = ReturnType<DuohertzSession["resultForKey"]>;

const JUDGMENTS = ["perfect", "great", "good", "miss"] as const;

function ResultNumbers({ result }: { result: Result | KeyResult }) {
  return <>
    <div className="dh-result__score">
      <strong>{result.accuracy}<span>%</span></strong>
      <div><b>Accuracy</b><small>{result.judged} / {result.total} notes</small></div>
    </div>
    <dl className="dh-result__judgments">
      {JUDGMENTS.map((name) => <div key={name}><dt>{name}</dt><dd>{result.counts[name]}</dd></div>)}
    </dl>
  </>;
}

export function DuohertzResultPanel({
  title,
  tier,
  mode,
  result,
  duoResults,
  coverUrl,
  onReplay,
  libraryHref,
  radioHref,
  preview,
}: {
  title: string;
  tier: DuohertzTier;
  mode: "solo" | "duo";
  result: Result;
  duoResults: [KeyResult, KeyResult] | null;
  coverUrl?: string;
  onReplay: () => void;
  libraryHref: string;
  radioHref?: string;
  preview: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  return <section className="dh-result" aria-labelledby="dh-result-heading">
    <div className="dh-result__top">
      <div className="dh-result__copy">
        <p className="dh-result__eyebrow">duohertz / run complete</p>
        <h2 id="dh-result-heading" tabIndex={-1} ref={headingRef}>Your frequency</h2>
        <p>Every beat is a place to begin. Play again whenever you like.</p>
        <span className="dh-result__track">{title} · {tier} · {mode === "duo" ? "two players" : "solo"}</span>
      </div>
      <div className="dh-result__art" aria-hidden="true">
        {coverUrl ? <img src={coverUrl} alt="" /> : <span>〰</span>}
      </div>
    </div>
    {mode === "duo" && duoResults ? <div className="dh-result__players">
      {duoResults.map((player, index) => <section key={index} aria-label={`Player ${index + 1} final result`}>
        <h3>Player {index + 1}</h3>
        <ResultNumbers result={player} />
      </section>)}
    </div> : <div className="dh-result__solo"><ResultNumbers result={result} /></div>}
    <div className="dh-result__actions">
      <button type="button" onClick={onReplay}>Play again <span aria-hidden="true">↗</span></button>
      <Link to={libraryHref}>Choose another beat <span aria-hidden="true">↗</span></Link>
      {radioHref && <Link to={radioHref}>Music station <span aria-hidden="true">↗</span></Link>}
    </div>
    <small className="dh-result__disclaimer">{preview
      ? "Development result with prototype timing. Music and artwork are unreviewed; no public score or ranking is saved."
      : "This result is not saved or ranked."}</small>
  </section>;
}
