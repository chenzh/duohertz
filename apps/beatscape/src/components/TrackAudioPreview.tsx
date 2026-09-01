import { useEffect, useRef } from "react";
import { assetUrl } from "../catalog/loadCatalog";
import { getMessages } from "../i18n";

type Props = {
  trackId: string;
  audioPath: string;
  title: string;
};

/** 15s game-clip preview so users can tell tracks apart before Play. */
export function TrackAudioPreview({ trackId, audioPath, title }: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  const t = getMessages();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    void el.load();
  }, [trackId, audioPath]);

  return (
    <div className="track-preview">
      <span className="track-preview-label">{t.ui.preview}</span>
      <audio
        ref={ref}
        key={trackId}
        controls
        preload="metadata"
        src={assetUrl(audioPath)}
        aria-label={`Preview ${title}`}
      />
    </div>
  );
}
