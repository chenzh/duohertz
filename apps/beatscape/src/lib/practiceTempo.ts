export const PRACTICE_TEMPOS = [0.5, 0.75, 1] as const;

export type PracticeTempo = (typeof PRACTICE_TEMPOS)[number];

export function formatPracticeTempo(tempo: PracticeTempo): string {
  return `${tempo.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`;
}
