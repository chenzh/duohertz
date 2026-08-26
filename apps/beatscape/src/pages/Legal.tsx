import { Link } from "../router";

type LegalKind = "privacy" | "terms";

const COPY: Record<
  LegalKind,
  { title: string; updated: string; sections: Array<{ h: string; p: string }> }
> = {
  privacy: {
    title: "Privacy",
    updated: "2026-08-26",
    sections: [
      {
        h: "What we store",
        p: "BeatScape Stage1 keeps play records, personal bests, calibration offset, and settings in your browser only (localStorage). There is no account, no forced registration, and no server upload of scores in Stage1–3.",
      },
      {
        h: "What we do not collect",
        p: "We do not sell personal data, do not run third-party ad trackers on the play surface, and do not request microphone, contacts, or location permissions for core play.",
      },
      {
        h: "Audio & content",
        p: "Catalog audio and charts are AI Original · Owned Rights assets generated for BeatScape. Playback happens in your browser via Web Audio.",
      },
      {
        h: "Your controls",
        p: "Clearing site data in your browser removes local scores and settings. You can also reset offset and keys from Settings.",
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    updated: "2026-08-26",
    sections: [
      {
        h: "Service",
        p: "BeatScape is a browser rhythm game provided as-is for entertainment. Features may change as Stage content expands.",
      },
      {
        h: "Content rights",
        p: "All catalog tracks are AI Original with Owned Rights (MusicSaas). You may not redistribute catalog audio, charts, or covers outside BeatScape without permission.",
      },
      {
        h: "Acceptable use",
        p: "Do not attempt to disrupt the service, scrape proprietary assets at scale, or misrepresent BeatScape content as third-party commercial hits.",
      },
      {
        h: "Disclaimer",
        p: "Play at your own risk. We are not liable for device performance, hearing fatigue, or data loss from clearing browser storage.",
      },
    ],
  },
};

export function LegalPage({ kind }: { kind: LegalKind }) {
  const doc = COPY[kind];
  return (
    <section className="legal-page" data-legal={kind}>
      <h1>{doc.title}</h1>
      <p className="legal-meta">BeatScape · Updated {doc.updated}</p>
      {doc.sections.map((s) => (
        <article key={s.h} className="legal-section">
          <h2>{s.h}</h2>
          <p>{s.p}</p>
        </article>
      ))}
      <p className="legal-back">
        <Link to="/settings">← Back to Settings</Link>
      </p>
    </section>
  );
}
