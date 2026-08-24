export type ChartTier = "easy" | "standard" | "hard";
export type PlayMode = "casual" | "arcade" | "practice";
export type Judgment = "perfect" | "great" | "good" | "miss";

export type TapNote = {
  id: string;
  t: number;
  lane: 0 | 1 | 2 | 3;
  type: "tap";
};

export type HoldNote = {
  id: string;
  t: number;
  lane: 0 | 1 | 2 | 3;
  type: "hold";
  end_t: number;
};

export type ChartNote = TapNote | HoldNote;

export type ChartJSON = {
  version: "1.1";
  meta: {
    title: string;
    artist: string;
    bpm: number;
    offset_ms: number;
    preset_id: string;
    chart_tier: ChartTier;
    play_mode?: PlayMode;
    approach_rate: number;
    audio_url: string;
    engine: "stable-audio-3" | "ace-step-1.5";
    sections?: Array<{ t: number; type: "drop" | "break" }>;
  };
  notes: ChartNote[];
};

export type SessionChart = {
  id: string;
  createdAt: number;
  presetId: string;
  presetLabel: string;
  audioBlobUrl: string;
  audioArrayBuffer?: ArrayBuffer;
  charts: Record<ChartTier, ChartJSON>;
  jobId?: string;
};

export type PlayResult = {
  score: number;
  accuracy: number;
  maxCombo: number;
  grade: "S" | "A" | "B" | "C" | "D";
  fullCombo: boolean;
  failed: boolean;
  judgments: Record<Judgment, number>;
};

export type Screen =
  | "landing"
  | "create"
  | "calibration"
  | "select"
  | "play"
  | "results";
