import { assetUrl } from "../catalog/loadCatalog";
import { getMessages } from "../i18n";
import { AudioBar } from "./AudioBar";

type Props = {
  trackId: string;
  audioPath: string;
  title: string;
};

const TRACK_PREVIEW_SECONDS = 15;

/** 15s game-clip preview so users can tell tracks apart before Play. */
export function TrackAudioPreview({ trackId, audioPath, title }: Props) {
  const t = getMessages();

  return (
    <div className="track-preview">
      <span className="track-preview-label">{t.ui.preview}</span>
      <AudioBar
        key={trackId}
        src={assetUrl(audioPath)}
        label={`${t.ui.preview} ${title}`}
        segmentSec={TRACK_PREVIEW_SECONDS}
      />
    </div>
  );
}
