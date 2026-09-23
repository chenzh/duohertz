import { useState, useSyncExternalStore } from "react";
import { trackEvent } from "../lib/analytics";
import {
  getPwaInstallServerSnapshot,
  getPwaInstallSnapshot,
  requestPwaInstall,
  subscribePwaInstall,
} from "../lib/pwa";

export function PwaInstallCard() {
  const available = useSyncExternalStore(
    subscribePwaInstall,
    getPwaInstallSnapshot,
    getPwaInstallServerSnapshot,
  );
  const [busy, setBusy] = useState(false);

  if (!available) return null;

  async function install() {
    if (busy) return;
    setBusy(true);
    const outcome = await requestPwaInstall();
    trackEvent("pwa_install_prompt", { outcome });
    setBusy(false);
  }

  return (
    <section className="pwa-install-card" aria-label="Install BeatScape">
      <div className="pwa-install-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3h14v-3" />
        </svg>
      </div>
      <div className="pwa-install-copy">
        <span>Keep BeatScape close</span>
        <strong>Open faster. Play without browser chrome.</strong>
        <small>Tracks you already opened stay available offline.</small>
      </div>
      <button type="button" className="btn pwa-install-action" onClick={() => void install()} disabled={busy}>
        {busy ? "Opening…" : "Install app"}
      </button>
    </section>
  );
}
