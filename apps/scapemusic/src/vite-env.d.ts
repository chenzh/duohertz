/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base path for deployment (default "/"). */
  readonly VITE_BASE?: string;
  /** BeatScape game origin, e.g. https://beatscape.pages.dev — used by the
   *  "Play the chart in BeatScape" deep link (commercialization 5-1 loop). */
  readonly VITE_GAME_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
