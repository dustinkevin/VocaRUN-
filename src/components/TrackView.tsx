import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GateOption, LaneIndex, WordItem } from '../types';
import { RunnerCharacter } from './RunnerCharacter';
import { ChevronLeft, ChevronRight, Zap, Volume2, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

interface TrackViewProps {
  currentLane: LaneIndex;
  onLaneChange: (lane: LaneIndex) => void;
  options: GateOption[];
  gateProgress: number; // 0 to 100
  isSlowed: boolean;
  statusEffect: 'none' | 'success' | 'stumble';
  onRush: () => void;
  isEvaluating: boolean;
  currentWord: WordItem;
  isSpeaking: boolean;
  onPronounce: () => void;
}

export const TrackView: React.FC<TrackViewProps> = ({
  currentLane,
  onLaneChange,
  options,
  gateProgress,
  isSlowed,
  statusEffect,
  onRush,
  isEvaluating,
  currentWord,
  isSpeaking,
  onPronounce,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch and pointer drag tracking for smooth swiping
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const isSwiping = useRef<boolean>(false);
  const [swipeHint, setSwipeHint] = useState<string | null>(null);
  const currentLaneRef = useRef(currentLane);

  useEffect(() => {
    currentLaneRef.current = currentLane;
  }, [currentLane]);

  const triggerSwipeLane = useCallback(
    (direction: 'left' | 'right') => {
      if (isEvaluating) return;
      const current = currentLaneRef.current;
      if (direction === 'left' && current > 0) {
        onLaneChange((current - 1) as LaneIndex);
      } else if (direction === 'right' && current < 2) {
        onLaneChange((current + 1) as LaneIndex);
      }
    },
    [isEvaluating, onLaneChange]
  );

  // Pointer event listeners on container for reliable touch & drag swiping
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      // Ignore if touched inside a button or the bottom action HUD
      if ((e.target as Element)?.closest('button, [data-no-swipe]')) return;
      pointerStartX.current = e.clientX;
      pointerStartY.current = e.clientY;
      isSwiping.current = true;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isSwiping.current || pointerStartX.current === null || pointerStartY.current === null) return;
      const deltaX = e.clientX - pointerStartX.current;
      const deltaY = e.clientY - pointerStartY.current;

      // Stable swipe threshold: 38px horizontal drag, distinctly horizontal over vertical
      if (Math.abs(deltaX) > 38 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        if (deltaX < 0) {
          triggerSwipeLane('left');
          setSwipeHint('◀ 왼쪽 통로 이동!');
        } else {
          triggerSwipeLane('right');
          setSwipeHint('오른쪽 통로 이동! ▶');
        }
        setTimeout(() => setSwipeHint(null), 500);
        isSwiping.current = false;
        pointerStartX.current = null;
        pointerStartY.current = null;
      }
    };

    const onPointerUp = () => {
      isSwiping.current = false;
      pointerStartX.current = null;
      pointerStartY.current = null;
    };

    el.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [triggerSwipeLane]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEvaluating) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (currentLane > 0) onLaneChange((currentLane - 1) as LaneIndex);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (currentLane < 2) onLaneChange((currentLane + 1) as LaneIndex);
      } else if (e.key === '1') {
        onLaneChange(0);
      } else if (e.key === '2') {
        onLaneChange(1);
      } else if (e.key === '3') {
        onLaneChange(2);
      } else if (e.key === ' ' || e.key === 'Enter') {
        onRush();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLane, onLaneChange, onRush, isEvaluating]);

  // STRAIGHT VERTICAL DESCENT CALCULATION:
  // Starts directly at CENTER TOP (중앙 상단) and rushes straight down to RUNNER (중앙 하단)
  // NO horizontal scale expansion or diagonal drift
  const normalizedProgress = Math.max(0, Math.min(100, gateProgress));
  const t = normalizedProgress / 100;

  // Top position moves in a pure straight vertical line from 12% (Center Top) down to 53% (Exact contact with Runner)
  // When gateProgress reaches 100%, the bottom edge of the word gates meets the runner immediately
  const gateTopPercent = 12 + t * 41;

  // 3 Straight Lanes Runner X position: exactly 16.7% (Left), 50% (Center), 83.3% (Right)
  const runnerX = currentLane === 0 ? '16.7%' : currentLane === 1 ? '50%' : '83.3%';

  return (
    <div
      ref={containerRef}
      id="track-stage"
      className={`relative w-full h-[480px] sm:h-[520px] overflow-hidden select-none rounded-3xl shadow-2xl border-2 border-slate-700/80 transition-colors duration-300 ${
        statusEffect === 'stumble'
          ? 'bg-rose-950/60 animate-[shake_0.4s_ease-in-out]'
          : statusEffect === 'success'
          ? 'bg-emerald-950/50'
          : isSlowed
          ? 'bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-950'
          : 'bg-gradient-to-b from-slate-900 via-indigo-950/70 to-slate-950'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* 1. SLIM NON-BLOCKING TOP WORD STATUS BAR (항상 단어 확인 가능) */}
      <div className="absolute top-2 left-3 right-3 z-35 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/50 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-ping" />
          <span className="text-xs font-black text-cyan-300 tracking-wider">단어:</span>
          <span className="text-sm sm:text-base font-black text-white tracking-wide">
            {currentWord.word}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            {currentWord.phonetic}
          </span>
          <button
            type="button"
            onClick={onPronounce}
            disabled={isSpeaking}
            className={`p-1 rounded-full transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-cyan-400 text-slate-950 scale-110 shadow-[0_0_10px_#38bdf8]'
                : 'bg-slate-800 text-cyan-300 hover:text-white'
            }`}
            title="발음 듣기"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        {/* Control Info Badge */}
        <div className="bg-slate-900/80 border border-slate-700/80 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-300 hidden sm:flex items-center gap-1.5 shadow">
          <span>좌우 스와이프 or 방향키 이동</span>
        </div>
      </div>

      {/* Swipe Feedback Banner */}
      {swipeHint && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1 rounded-full bg-cyan-400 text-slate-950 font-black text-xs shadow-xl animate-bounce pointer-events-none flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{swipeHint}</span>
        </div>
      )}

      {/* 2. STRAIGHT VERTICAL 3-LANE TRACK BACKGROUND (직선 수직 레일) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 400 500"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            {/* Glowing Active Track Floor */}
            <linearGradient id="activeLaneGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
            </linearGradient>

            {/* Straight Steel Rail Gradient */}
            <linearGradient id="steelRail" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Dark Track Bed */}
          <rect x="0" y="0" width="400" height="500" fill="#070b14" />

          {/* ACTIVE LANE GROUND HIGHLIGHT (직선 수직 레인 강조) */}
          {currentLane === 0 && (
            <rect x="0" y="0" width="133.3" height="500" fill="url(#activeLaneGlow)" />
          )}
          {currentLane === 1 && (
            <rect x="133.3" y="0" width="133.3" height="500" fill="url(#activeLaneGlow)" />
          )}
          {currentLane === 2 && (
            <rect x="266.6" y="0" width="133.4" height="500" fill="url(#activeLaneGlow)" />
          )}

          {/* STRAIGHT VERTICAL LANE DIVIDER GUIDELINES */}
          <line x1="133.3" y1="0" x2="133.3" y2="500" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="8,6" opacity="0.4" />
          <line x1="266.6" y1="0" x2="266.6" y2="500" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="8,6" opacity="0.4" />

          {/* HORIZONTAL RAIL TIES / SLEEPERS ACROSS THE STRAIGHT TRACKS */}
          {[40, 90, 140, 190, 240, 290, 340, 390, 440, 480].map((tieY, idx) => (
            <g key={idx} opacity={0.4}>
              <rect
                x="15"
                y={tieY}
                width="370"
                height="4"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="0.5"
                rx="1"
              />
            </g>
          ))}

          {/* 3 PAIRS OF STRAIGHT VERTICAL STEEL RAILS (직선 레일) */}
          {/* Lane 0 (Left Track: Center at 66.7px) */}
          <line x1="48" y1="0" x2="48" y2="500" stroke="url(#steelRail)" strokeWidth="2.5" />
          <line x1="85" y1="0" x2="85" y2="500" stroke="url(#steelRail)" strokeWidth="2.5" />

          {/* Lane 1 (Center Track: Center at 200px) */}
          <line x1="181" y1="0" x2="181" y2="500" stroke="url(#steelRail)" strokeWidth="2.5" />
          <line x1="219" y1="0" x2="219" y2="500" stroke="url(#steelRail)" strokeWidth="2.5" />

          {/* Lane 2 (Right Track: Center at 333.3px) */}
          <line x1="315" y1="0" x2="315" y2="500" stroke="url(#steelRail)" strokeWidth="2.5" />
          <line x1="352" y1="0" x2="352" y2="500" stroke="url(#steelRail)" strokeWidth="2.5" />
        </svg>
      </div>

      {/* 3. APPROACHING WORDS & 3 GATES DESCENDING IN A PURE STRAIGHT VERTICAL LINE */}
      {/* 중앙 상단에서 중앙 하단으로 직선 수직 하강 (No horizontal expansion, pure vertical Y motion) */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-[500px] pointer-events-none z-20 ${
          statusEffect === 'success'
            ? 'transition-all duration-200 ease-out translate-y-6 opacity-30 scale-105'
            : statusEffect === 'stumble'
            ? 'transition-all duration-150 ease-out opacity-75'
            : 'transition-none'
        }`}
        style={{
          top: `${gateTopPercent}%`,
          willChange: 'top',
        }}
      >
        <div className="flex flex-col items-center w-full">
          {/* OVERHEAD ILLUMINATED BILLBOARD: ENGLISH WORD */}
          <div className="w-full bg-slate-900/98 border-2 border-amber-400/90 rounded-2xl p-2.5 sm:p-3 shadow-[0_0_24px_rgba(245,158,11,0.35)] flex flex-col items-center justify-center text-center backdrop-blur-md mb-2">
            <div className="flex items-center justify-between w-full px-2 mb-0.5">
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                🚇 TARGET WORD
              </span>
              <span className="text-[10px] font-extrabold text-cyan-300">
                {currentWord.partOfSpeech || '단어'}
              </span>
            </div>

            {/* Giant English Word */}
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-amber-300 tracking-wider font-['Fredoka',sans-serif] drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
              {currentWord.word}
            </div>

            {/* Subtitle instruction */}
            <div className="text-[10px] font-bold text-slate-300 mt-0.5">
              맞는 뜻의 통로로 캐릭터를 이동하세요!
            </div>
          </div>

          {/* 3 WORDS / TUNNEL GATES (1번 왼쪽 / 2번 중앙 / 3번 오른쪽) - STRAIGHT COLUMNS */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {options.map((opt) => {
              const isPlayerHere = currentLane === opt.lane;
              return (
                <div
                  key={opt.lane}
                  className={`relative rounded-2xl flex flex-col items-center justify-between p-2.5 sm:p-3 transition-colors duration-100 border-2 shadow-2xl backdrop-blur-md ${
                    isEvaluating && isPlayerHere && opt.isCorrect
                      ? 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-500/80 ring-4 ring-emerald-300 scale-105'
                      : isEvaluating && isPlayerHere && !opt.isCorrect
                      ? 'bg-rose-600 border-rose-300 text-white shadow-rose-600/80 ring-4 ring-rose-400 scale-95'
                      : isPlayerHere
                      ? 'bg-slate-900/98 border-cyan-400 text-white ring-4 ring-cyan-400/60 shadow-[0_0_24px_rgba(6,182,212,0.7)]'
                      : 'bg-slate-900/95 border-slate-700/90 text-slate-200 shadow-xl'
                  }`}
                >
                  {/* Gate Top Header Badge */}
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider mb-1 uppercase flex items-center justify-center gap-1 w-full text-center ${
                      isPlayerHere
                        ? 'bg-cyan-400 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{opt.lane + 1}번</span>
                    <span>{opt.lane === 0 ? '왼쪽' : opt.lane === 1 ? '중앙' : '오른쪽'}</span>
                  </div>

                  {/* Korean Meaning text (Bold, Large, High Contrast) */}
                  <div className="text-center font-black text-xs sm:text-sm md:text-base leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] min-h-[38px] flex items-center justify-center px-1 break-keep text-white">
                    {opt.text}
                  </div>

                  {/* Player Position Status on Gate */}
                  <div className="w-full flex items-center justify-center mt-1.5 pt-1 border-t border-white/10 text-[9px] font-bold">
                    {isEvaluating && isPlayerHere ? (
                      opt.isCorrect ? (
                        <span className="flex items-center gap-1 text-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                          정답 통과!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-200">
                          <XCircle className="w-3 h-3 text-rose-300" />
                          오답 충돌!
                        </span>
                      )
                    ) : isPlayerHere ? (
                      <span className="text-cyan-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        내 캐릭터 위치
                      </span>
                    ) : (
                      <span className="text-slate-500">통로 {opt.lane + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. RUNNER CHARACTER AT BOTTOM (Y: 74%, STRAIGHT VERTICAL LANES) */}
      <div
        className="absolute bottom-16 sm:bottom-18 transition-all duration-150 ease-out z-25 pointer-events-none -translate-x-1/2"
        style={{ left: runnerX }}
      >
        <RunnerCharacter
          lane={currentLane}
          isSlowed={isSlowed}
          statusEffect={statusEffect}
        />
      </div>

      {/* 5. INTERACTIVE 3-LANE TAP ZONES (상단 및 중단 트랙 영역만 커버, 하단 조작 HUD와 겹치지 않음) */}
      <div className="absolute inset-x-0 top-14 bottom-36 grid grid-cols-3 z-15 pointer-events-auto">
        <button
          type="button"
          aria-label="1번 왼쪽 통로 선택"
          onClick={(e) => {
            e.stopPropagation();
            onLaneChange(0);
          }}
          className="w-full h-full focus:outline-none hover:bg-cyan-500/5 active:bg-cyan-500/15 cursor-pointer touch-manipulation"
        />
        <button
          type="button"
          aria-label="2번 중앙 통로 선택"
          onClick={(e) => {
            e.stopPropagation();
            onLaneChange(1);
          }}
          className="w-full h-full focus:outline-none hover:bg-cyan-500/5 active:bg-cyan-500/15 cursor-pointer touch-manipulation"
        />
        <button
          type="button"
          aria-label="3번 오른쪽 통로 선택"
          onClick={(e) => {
            e.stopPropagation();
            onLaneChange(2);
          }}
          className="w-full h-full focus:outline-none hover:bg-cyan-500/5 active:bg-cyan-500/15 cursor-pointer touch-manipulation"
        />
      </div>

      {/* 6. BOTTOM ACTION HUD: ALWAYS-LEGIBLE QUICK SELECT CARDS & CONTROLS */}
      <div
        data-no-swipe="true"
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute bottom-2 left-2 right-2 flex flex-col gap-1.5 z-30 px-1 pointer-events-auto"
      >
        {/* 3 Quick Lane Answer Badges */}
        <div className="grid grid-cols-3 gap-1.5 w-full">
          {options.map((opt) => {
            const isSelected = currentLane === opt.lane;
            return (
              <button
                key={opt.lane}
                type="button"
                disabled={isEvaluating}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLaneChange(opt.lane);
                }}
                className={`py-1 px-2 rounded-xl text-left flex flex-col justify-center border transition-all active:scale-95 cursor-pointer backdrop-blur-md shadow-md touch-manipulation select-none ${
                  isSelected
                    ? 'bg-cyan-500/25 border-cyan-400 text-white ring-2 ring-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-black pointer-events-none">
                  <span className={isSelected ? 'text-cyan-300' : 'text-slate-400'}>
                    {opt.lane + 1}번 {opt.lane === 0 ? '(왼)' : opt.lane === 1 ? '(중)' : '(오)'}
                  </span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                </div>
                <div className="text-xs sm:text-sm font-extrabold truncate text-white pointer-events-none">
                  {opt.text}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Controls: Left, Rush (즉시 통과), Right */}
        <div className="flex items-center justify-between gap-2">
          {/* Left button */}
          <button
            type="button"
            disabled={currentLane === 0 || isEvaluating}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (currentLane > 0) onLaneChange((currentLane - 1) as LaneIndex);
            }}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1 text-xs sm:text-sm font-black shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer touch-manipulation select-none ${
              currentLane === 0
                ? 'bg-slate-800/40 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                : 'bg-slate-800/95 text-white border-2 border-cyan-500/60 hover:bg-slate-700 active:bg-cyan-600'
            }`}
          >
            <ChevronLeft className="w-4 h-4 text-cyan-400 pointer-events-none" />
            <span className="pointer-events-none">◀ 왼쪽</span>
          </button>

          {/* Instant Rush Button */}
          <button
            type="button"
            disabled={isEvaluating}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRush();
            }}
            className="flex-1 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95 hover:brightness-110 cursor-pointer touch-manipulation select-none"
          >
            <Zap className="w-4 h-4 fill-slate-950 text-slate-950 pointer-events-none" />
            <span className="pointer-events-none">즉시 통과!</span>
          </button>

          {/* Right button */}
          <button
            type="button"
            disabled={currentLane === 2 || isEvaluating}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (currentLane < 2) onLaneChange((currentLane + 1) as LaneIndex);
            }}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1 text-xs sm:text-sm font-black shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer touch-manipulation select-none ${
              currentLane === 2
                ? 'bg-slate-800/40 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                : 'bg-slate-800/95 text-white border-2 border-cyan-500/60 hover:bg-slate-700 active:bg-cyan-600'
            }`}
          >
            <span className="pointer-events-none">오른쪽 ▶</span>
            <ChevronRight className="w-4 h-4 text-cyan-400 pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
};
