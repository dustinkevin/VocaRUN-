import { WordItem, DifficultyLevel, DifficultyInfo } from '../types';
import { EASY_WORDS } from './easyWords';
import { MEDIUM_WORDS } from './mediumWords';
import { HARD_WORDS } from './hardWords';

export { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS };

export const DIFFICULTY_WORDS: Record<DifficultyLevel, WordItem[]> = {
  easy: EASY_WORDS,
  medium: MEDIUM_WORDS,
  hard: HARD_WORDS,
};

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyInfo> = {
  easy: {
    id: 'easy',
    label: '쉬움',
    badge: '초등 기초 어휘',
    desc: '일상 생활, 자연, 기초 명사·동사 중심의 친근한 영단어',
    color: 'emerald',
  },
  medium: {
    id: 'medium',
    label: '중간',
    badge: '초등 심화·중등 필수',
    desc: '교과 필수 어휘 및 사회·환경·감정 관련 핵심 영단어',
    color: 'amber',
  },
  hard: {
    id: 'hard',
    label: '어려움',
    badge: '중등 심화 어휘',
    desc: '상위권 도약을 위한 추상 개념 및 고급 필수 영단어',
    color: 'rose',
  },
};

/**
 * Shuffles an array and returns a randomized subset of requested count
 */
export function getRandomWords(
  difficulty: DifficultyLevel,
  count = 30
): WordItem[] {
  const pool = DIFFICULTY_WORDS[difficulty] || DIFFICULTY_WORDS.easy;
  // Fisher-Yates modern shuffle
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

// Backward compatibility helper
export const WORD_SETS: Record<number, WordItem[]> = {
  1: EASY_WORDS.slice(0, 30),
  2: MEDIUM_WORDS.slice(0, 30),
  3: HARD_WORDS.slice(0, 30),
};
