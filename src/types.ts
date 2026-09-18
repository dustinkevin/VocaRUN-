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

export interface QuestionHistory {
  word: WordItem;
  chosenMeaning: string;
  isCorrect: boolean;
  lane: LaneIndex;
}

export type GameScreenType = 'start' | 'playing' | 'result';

export interface GameSettings {
  soundEnabled: boolean;
  speechRate: number; // 0.8 ~ 1.0
}
