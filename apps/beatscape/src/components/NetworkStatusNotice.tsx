import { useEffect, useState } from "react";

export function NetworkStatusNotice() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online) return null;
  return (
    <div className="network-status-notice" role="status" aria-live="polite">
      <strong>Offline mode</strong>
      <span>Previously opened tracks can still play. Connect to load something new.</span>
    </div>
  );
}
