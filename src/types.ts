export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyInfo {
  id: DifficultyLevel;
  label: string;
  badge: string;
  desc: string;
  color: string;
}

export interface WordItem {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  distractors: [string, string];
  exampleEn: string;
  exampleKo: string;
}

export type LaneIndex = 0 | 1 | 2; // 0: Left, 1: Center, 2: Right

export interface GateOption {
  lane: LaneIndex;
  text: string;
  isCorrect: boolean;
}

export interface SentenceTapStat {
  index: number;
  word: string;
  sentence: string;
  sentenceMeaning: string;
  tapCount: number;
  isCorrect: boolean;
}

export interface QuestionHistory {
  word: WordItem;
  chosenMeaning: string;
  isCorrect: boolean;
  lane: LaneIndex;
  tapCount: number;
  sentence: string;
}

export type GameScreenType = 'start' | 'playing' | 'result';

export interface GameSettings {
  soundEnabled: boolean;
  speechRate: number; // 0.8 ~ 1.0
}

export interface GameRecord {
  submission_id?: string;
  timestamp: string;
  name: string;
  play_count: number;
  correct_count: number;
  wrong_count: number;
  difficulty?: DifficultyLevel;
  score?: number;
  avg_taps?: number;
  average_taps?: number;
  total_taps?: number;
  sentence_tap_frequencies?: string;
  sentence_stats?: SentenceTapStat[];
}

export type SheetSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

