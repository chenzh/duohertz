import type { Preset } from "../presets";
import type { Locale } from "../i18n";

export function PresetChips({
  presets,
  locale,
  onSelect,
}: {
  presets: Preset[];
  locale: Locale;
  onSelect: (preset: Preset) => void;
}) {
  return (
    <div className="preset-chips">
      {presets.map((p) => (
        <button key={p.id} type="button" className="chip" onClick={() => onSelect(p)}>
          {locale === "zh" ? p.labelZh : p.labelEn}
        </button>
      ))}
    </div>
  );
}
