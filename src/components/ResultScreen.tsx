import React, { useState, useEffect } from 'react';
import { WordItem, QuestionHistory, DifficultyLevel } from '../types';
import { DIFFICULTY_CONFIGS } from '../data/words';
import { speakWord, playSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Volume2,
  RotateCcw,
  Home,
  BookOpen,
  ArrowRight,
  CheckCircle,
  XCircle,
  Award,
  Sparkles,
  Shuffle,
} from 'lucide-react';

interface ResultScreenProps {
  score: number;
  totalWordsCount: number;
  wrongWords: WordItem[];
  history: QuestionHistory[];
  difficulty: DifficultyLevel;
  onRetry: () => void;
  onGoHome: () => void;
  onNextSet: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  score,
  totalWordsCount,
  wrongWords,
  history,
  difficulty,
  onRetry,
  onGoHome,
  onNextSet,
}) => {
  const diffConfig = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.easy;
  const [activeTab, setActiveTab] = useState<'wrong' | 'all'>(
    wrongWords.length > 0 ? 'wrong' : 'all'
  );
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  const correctCount = history.filter((h) => h.isCorrect).length;
  const isAllCleared = history.length === totalWordsCount;
  const isPerfect = wrongWords.length === 0 && isAllCleared;
  const maxScore = totalWordsCount * 100;
  const accuracyPercent = Math.round((correctCount / totalWordsCount) * 100);

  // Trigger celebration effects
  useEffect(() => {
    if (isPerfect || accuracyPercent >= 80) {
      playSound.victory();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti errors
      }
    }
  }, [isPerfect, accuracyPercent]);

  // Handle speaker pronunciation playback
  const handlePlayWord = (wordItem: WordItem) => {
    setPlayingWordId(wordItem.id);
    speakWord(wordItem.word, () => setPlayingWordId(null));
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-between min-h-[92vh] py-5 px-4 space-y-5">
      {/* 1. SCORE SUMMARY HERO */}
      <div className="bg-gradient-to-b from-slate-900/95 to-indigo-950/90 border border-cyan-500/30 rounded-3xl p-5 shadow-2xl text-center relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Clear / Game Over Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 shadow">
          {isPerfect ? (
            <span className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              PERFECT CLEAR! 전원 정답
            </span>
          ) : isAllCleared ? (
            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              레이스 완주 성공!
            </span>
          ) : (
            <span className="bg-rose-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              속도 저하로 중도 종료 (재도전 추천!)
            </span>
          )}
        </div>

        {/* Difficulty Badge */}
        <div className="mb-2 flex items-center justify-center gap-1.5">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5 shadow-sm">
            <span>{difficulty === 'easy' ? '🟢' : difficulty === 'medium' ? '🟡' : '🔴'}</span>
            <span className="text-cyan-400 font-extrabold">{diffConfig.label} 난이도</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 text-[11px]">{diffConfig.badge}</span>
          </span>
        </div>

        {/* Trophy Icon */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <Trophy className="w-9 h-9" />
          </div>
        </div>

        {/* Total Score Display (총점 확인) */}
        <div className="space-y-1">
          <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
            나의 최종 점수
          </span>
          <div className="text-4xl sm:text-5xl font-black text-amber-300 font-mono tracking-tight">
            {score.toLocaleString()}{' '}
            <span className="text-lg text-slate-400 font-normal">/ {maxScore.toLocaleString()}P</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
          <div className="bg-slate-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">정답 단어</span>
            <span className="text-lg font-bold text-emerald-400">
              {correctCount}개
            </span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">틀린 단어</span>
            <span className="text-lg font-bold text-rose-400">
              {wrongWords.length}개
            </span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">학습 정답률</span>
            <span className="text-lg font-bold text-cyan-400">
              {accuracyPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. REVIEW WORDS SECTION (틀린 단어 다시보기 및 스피커 다시 듣기) */}
      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col min-h-[300px]">
        {/* Tab Headers */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm text-slate-200">
              단어 복습 노트
            </span>
          </div>

          <div className="flex gap-1 bg-slate-800/80 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('wrong')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'wrong'
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              틀린 단어 ({wrongWords.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              전체 학습 ({history.length})
            </button>
          </div>
        </div>

        {/* Word Cards List */}
        <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2.5 pr-1 custom-scrollbar">
          {activeTab === 'wrong' ? (
            wrongWords.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-200 text-sm">
                  틀린 단어가 없습니다!
                </p>
                <p className="text-xs text-slate-400">
                  완벽하게 모든 필수 단어의 뜻을 통과했어요!
                </p>
              </div>
            ) : (
              wrongWords.map((word, idx) => (
                <div
                  key={`${word.id}-${idx}`}
                  className="bg-slate-800/80 border border-rose-500/30 hover:border-rose-400/50 rounded-2xl p-3 flex items-start justify-between gap-2 shadow-sm transition-all"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-white font-['Fredoka',sans-serif]">
                        {word.word}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {word.phonetic}
                      </span>
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                        {word.partOfSpeech}
                      </span>
                    </div>

                    {/* Exact Korean Meaning (올바른 뜻) */}
                    <div className="text-xs font-bold text-amber-300">
                      💡 정답 뜻: {word.meaning}
                    </div>

                    {/* Example Sentence */}
                    <div className="text-[11px] text-slate-300 bg-slate-900/60 px-2 py-1.5 rounded-lg mt-1 space-y-0.5">
                      <p className="text-slate-200">{word.exampleEn}</p>
                      <p className="text-slate-400 text-[10px]">{word.exampleKo}</p>
                    </div>
                  </div>

                  {/* [스피커 다시 듣기] 버튼 */}
                  <button
                    type="button"
                    onClick={() => handlePlayWord(word)}
                    disabled={playingWordId === word.id}
                    className={`shrink-0 p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                      playingWordId === word.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_#38bdf8]'
                        : 'bg-slate-900/80 text-cyan-400 border-slate-700 hover:bg-slate-800 hover:text-cyan-300'
                    }`}
                    title="스피커 다시 듣기"
                  >
                    <Volume2
                      className={`w-4 h-4 ${
                        playingWordId === word.id ? 'animate-pulse' : ''
                      }`}
                    />
                    <span className="text-[9px] font-bold">발음 듣기</span>
                  </button>
                </div>
              ))
            )
          ) : (
            /* All words tab */
            history.map((item, idx) => (
              <div
                key={`${item.word.id}-all-${idx}`}
                className={`bg-slate-800/70 border rounded-2xl p-3 flex items-start justify-between gap-2 shadow-sm ${
                  item.isCorrect
                    ? 'border-emerald-500/30 hover:border-emerald-400/50'
                    : 'border-rose-500/30 hover:border-rose-400/50'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {item.isCorrect ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> 정답
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <XCircle className="w-3 h-3" /> 오답
                      </span>
                    )}
                    <span className="text-base font-extrabold text-white font-['Fredoka',sans-serif]">
                      {item.word.word}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.word.phonetic}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-200">
                    뜻: {item.word.meaning}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    {item.word.exampleEn}
                  </div>
                </div>

                {/* Speaker button */}
                <button
                  type="button"
                  onClick={() => handlePlayWord(item.word)}
                  disabled={playingWordId === item.word.id}
                  className={`shrink-0 p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                    playingWordId === item.word.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-slate-900/80 text-cyan-400 border-slate-700 hover:bg-slate-800'
                  }`}
                  title="스피커 다시 듣기"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="text-[9px] font-bold">발음 듣기</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. THREE ACTION BUTTONS: [다시하기], [처음으로], [추가 학습] */}
      <div className="space-y-2.5 pt-1">
        {/* [추가 학습] 버튼 (새로운 세트 진행) */}
        <button
          id="btn-next-set"
          type="button"
          onClick={onNextSet}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Shuffle className="w-5 h-5 text-slate-950" />
          <span>새로운 단어 랜덤 런 ({diffConfig.label})</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          {/* [다시하기] 버튼 (현재 단어 세트 다시 도전) */}
          <button
            id="btn-retry"
            type="button"
            onClick={onRetry}
            className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-cyan-500/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>다시하기</span>
          </button>

          {/* [처음으로] 버튼 (시작 화면으로) */}
          <button
            id="btn-go-home"
            type="button"
            onClick={onGoHome}
            className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>처음으로</span>
          </button>
        </div>
      </div>
    </div>
  );
};
