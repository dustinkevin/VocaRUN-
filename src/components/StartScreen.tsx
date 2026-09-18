import React from 'react';
import { RunnerCharacter } from './RunnerCharacter';
import { DifficultyLevel } from '../types';
import { DIFFICULTY_CONFIGS } from '../data/words';
import { Play, Sparkles, Volume2, ShieldCheck, Trophy, Shuffle, Flame } from 'lucide-react';

interface StartScreenProps {
  onStart: (difficulty?: DifficultyLevel) => void;
  selectedDifficulty: DifficultyLevel;
  onSelectDifficulty: (diff: DifficultyLevel) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  selectedDifficulty,
  onSelectDifficulty,
}) => {
  const currentConfig = DIFFICULTY_CONFIGS[selectedDifficulty];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-between min-h-[90vh] py-5 px-4">
      {/* Top Tag & Title Logo */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>쉽고 빠르게 외우는 영단어</span>
        </div>

        {/* Dynamic Title Logo */}
        <div className="relative pt-1">
          <h1 className="text-5xl sm:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 drop-shadow-[0_4px_16px_rgba(56,189,248,0.4)] font-['Fredoka',sans-serif]">
            Voca<span className="text-amber-400">RUN!</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1 text-slate-400 text-xs font-medium">
            <span>달리며 암기하는 스피드 어휘 러너</span>
          </div>
        </div>
      </div>

      {/* Center Hero: Running Character in Stadium Stage */}
      <div className="w-full my-3 flex flex-col items-center justify-center">
        <div className="relative w-64 sm:w-72 h-44 rounded-3xl bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-[0_0_30px_rgba(56,189,248,0.15)] flex flex-col items-center justify-center overflow-hidden">
          {/* Top Badges Bar - permanently separated to left and right */}
          <div className="absolute top-2.5 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
            <div className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
              <Shuffle className="w-3 h-3" />
              <span>무작위 출제</span>
            </div>

            <div className="flex items-center gap-1 bg-amber-400/90 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow whitespace-nowrap">
              <Trophy className="w-3 h-3" />
              <span>스피드 레이스</span>
            </div>
          </div>

          {/* Neon track floor */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-cyan-900/40 to-transparent border-b-2 border-cyan-400" />
          <div className="absolute bottom-5 w-full flex justify-around opacity-30 text-[9px] font-mono text-cyan-300">
            <span>LANE 1</span>
            <span>LANE 2</span>
            <span>LANE 3</span>
          </div>

          <div className="z-10 mt-3">
            <RunnerCharacter lane={1} isSlowed={false} />
          </div>
        </div>

        {/* 3-TIER DIFFICULTY SELECTOR (쉬움, 중간, 어려움) */}
        <div className="w-full mt-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <span>난이도 선택</span>
            </span>
            <span className="text-[11px] text-cyan-400 font-medium">
              단계별 맞춤 영단어
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => {
              const config = DIFFICULTY_CONFIGS[level];
              const isSelected = selectedDifficulty === level;
              return (
                <button
                  key={level}
                  id={`btn-diff-${level}`}
                  type="button"
                  onClick={() => onSelectDifficulty(level)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? level === 'easy'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                        : level === 'medium'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
                      : 'text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm font-extrabold flex items-center gap-1">
                    {level === 'easy' ? '🟢' : level === 'medium' ? '🟡' : '🔴'} {config.label}
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      isSelected
                        ? level === 'medium'
                          ? 'text-slate-900'
                          : 'text-white/90'
                        : 'text-slate-400'
                    }`}
                  >
                    {config.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Difficulty Description Card */}
          <div className="mt-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
            <p className="text-xs font-medium text-slate-300">
              <span className="font-bold text-cyan-400">[{currentConfig.badge}]</span>{' '}
              {currentConfig.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Quick 30-second How-to-Play Card */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-lg mb-4">
        <h2 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>게임 룰 안내</span>
        </h2>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50 flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center text-[11px] mb-1">
              1
            </div>
            <span className="font-bold text-slate-200">랜덤 단어</span>
            <span className="text-[10px] text-slate-400 mt-0.5">매판 새 단어</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50 flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center text-[11px] mb-1">
              2
            </div>
            <span className="font-bold text-slate-200">정답 통로</span>
            <span className="text-[10px] text-slate-400 mt-0.5">좌우로 이동</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50 flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 font-black flex items-center justify-center text-[11px] mb-1">
              3
            </div>
            <span className="font-bold text-slate-200">속도 가속</span>
            <span className="text-[10px] text-slate-400 mt-0.5">맞힐수록 빨라짐</span>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>원어민 음성 발음 & 오답 자동 복습 노트 제공</span>
        </div>
      </div>

      {/* Main Start Button */}
      <div className="w-full">
        <button
          id="btn-game-start"
          type="button"
          onClick={() => onStart(selectedDifficulty)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xl tracking-tight shadow-[0_10px_25px_rgba(56,189,248,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>게임 시작 ({currentConfig.label} 런)</span>
        </button>
      </div>
    </div>
  );
};

