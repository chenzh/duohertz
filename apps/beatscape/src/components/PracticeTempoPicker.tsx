import { useId } from "react";
import {
  formatPracticeTempo,
  PRACTICE_TEMPOS,
  type PracticeTempo,
} from "../lib/practiceTempo";

export function PracticeTempoPicker({
  className,
  tempo,
  onChange,
}: {
  className: string;
  tempo: PracticeTempo;
  onChange: (tempo: PracticeTempo) => void;
}) {
  const groupName = useId();

  return (
    <fieldset className={className}>
      <legend>Practice tempo</legend>
      <p>Music + chart · this run only</p>
      <div className="practice-tempo-options" role="radiogroup" aria-label="Practice tempo">
        {PRACTICE_TEMPOS.map((option) => (
          <label key={option} data-active={tempo === option ? "true" : "false"}>
            <input
              type="radio"
              name={groupName}
              aria-label={`${Math.round(option * 100)}% tempo`}
              checked={tempo === option}
              onChange={() => onChange(option)}
            />
            <span>{formatPracticeTempo(option)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
