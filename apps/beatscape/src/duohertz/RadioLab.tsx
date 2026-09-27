import { DUOHERTZ_STREAM_CANDIDATE_ENTRIES } from "./candidate";
import { DuohertzRadio } from "./Radio";

/** DEV-only source adapter for unreviewed stream masters. */
export function DuohertzRadioLabPage() {
  return <DuohertzRadio entries={DUOHERTZ_STREAM_CANDIDATE_ENTRIES} preview gameHref="/lab/duohertz" />;
}
