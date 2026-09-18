import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WordItem, LaneIndex, GateOption, QuestionHistory, DifficultyLevel } from '../types';
import { DIFFICULTY_CONFIGS } from '../data/words';
import { TrackView } from './TrackView';
import { playSound, speakWord } from '../utils/audio';
import { Volume2, AlertTriangle, Flame, Pause, Play, RotateCcw, Zap } from 'lucide-react';

interface GameScreenProps {
  words: WordItem[];
  difficulty?: DifficultyLevel;
  onFinish: (score: number, wrongWords: WordItem[], history: QuestionHistory[]) => void;
  onExitToMenu: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  words,
  difficulty = 'easy',
  onFinish,
  onExitToMenu,
}) => {
  const diffConfig = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.easy;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isSlowed, setIsSlowed] = useState<boolean>(false);
  const [currentLane, setCurrentLane] = useState<LaneIndex>(1); // starts in center lane (1)
  const [gateProgress, setGateProgress] = useState<number>(0); // 0 to 100
  const [wrongWords, setWrongWords] = useState<WordItem[]>([]);
  const [history, setHistory] = useState<QuestionHistory[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [statusEffect, setStatusEffect] = useState<'none' | 'success' | 'stumble'>('none');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const currentWord = words[currentIndex] || words[0];

  // Stable refs for game loop to avoid unnecessary recreation or multi-triggers
  const isEvaluatingRef = useRef(false);
  const isPausedRef = useRef(false);
  const currentLaneRef = useRef(currentLane);
  const optionsRef = useRef<GateOption[]>([]);
  const isSlowedRef = useRef(isSlowed);
  const streakRef = useRef(streak);
  const correctCountRef = useRef(0);
  const gateProgressRef = useRef(0);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    currentLaneRef.current = currentLane;
  }, [currentLane]);

  useEffect(() => {
    isSlowedRef.current = isSlowed;
  }, [isSlowed]);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    correctCountRef.current = correctCount;
  }, [correctCount]);

  // Helper to shuffle options and assign to 3 lanes
  const generateLaneOptions = useCallback((word: WordItem): GateOption[] => {
    if (!word) return [];
    // 1 correct meaning, 2 distractors
    const allMeanings = [
      { text: word.meaning, isCorrect: true },
      { text: word.distractors[0] || '오답 1', isCorrect: false },
      { text: word.distractors[1] || '오답 2', isCorrect: false },
    ];

    // Fisher-Yates shuffle
    for (let i = allMeanings.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allMeanings[i], allMeanings[j]] = [allMeanings[j], allMeanings[i]];
    }

    return allMeanings.map((item, index) => ({
      lane: index as LaneIndex,
      text: item.text,
      isCorrect: item.isCorrect,
    }));
  }, []);

  const [options, setOptions] = useState<GateOption[]>(() => {
    const initialWord = words[0];
    return initialWord ? [
      { lane: 0, text: initialWord.meaning, isCorrect: true },
      { lane: 1, text: initialWord.distractors[0] || '', isCorrect: false },
      { lane: 2, text: initialWord.distractors[1] || '', isCorrect: false },
    ] : [];
  });



  // Evaluation logic when gate reaches runner or player hits rush
  const handleEvaluateAnswer = useCallback(() => {
    if (isEvaluatingRef.current) return;
    isEvaluatingRef.current = true;
    setIsEvaluating(true);

    const activeLane = currentLaneRef.current;
    const currentOptions = optionsRef.current.length > 0 ? optionsRef.current : options;
    const chosenOption = currentOptions.find((opt) => opt.lane === activeLane);
    const isCorrect = chosenOption ? chosenOption.isCorrect : false;

    // Record question history
    const historyItem: QuestionHistory = {
      word: currentWord,
      chosenMeaning: chosenOption ? chosenOption.text : '',
      isCorrect,
      lane: activeLane,
    };
    const updatedHistory = [...history, historyItem];
    setHistory(updatedHistory);

    if (isCorrect) {
      // SUCCESS FEEDBACK
      playSound.success();
      setStatusEffect('success');
      const newScore = score + 100;
      setScore(newScore);
      setStreak((prev) => prev + 1);
      streakRef.current = streakRef.current + 1;
      setCorrectCount((prev) => prev + 1);
      correctCountRef.current = correctCountRef.current + 1;

      // If previously slowed, recovering gives a boost
      if (isSlowedRef.current) {
        setIsSlowed(false);
        playSound.speedRecover();
      }

      // Fast and natural pass-through transition (300ms)
      setTimeout(() => {
        if (currentIndex + 1 >= words.length) {
          // Completed all words!
          onFinish(newScore, wrongWords, updatedHistory);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 300);
    } else {
      // WRONG FEEDBACK
      playSound.wrong();
      setStatusEffect('stumble');
      setStreak(0);
      streakRef.current = 0;
      const updatedWrongs = [...wrongWords, currentWord];
      setWrongWords(updatedWrongs);

      if (isSlowedRef.current) {
        // SECOND CONSECUTIVE WRONG: GAME OVER!
        playSound.gameOver();
        setTimeout(() => {
          onFinish(score, updatedWrongs, updatedHistory);
        }, 550);
      } else {
        // FIRST WRONG: SLOWDOWN EFFECT APPLIED!
        setIsSlowed(true);
        setTimeout(() => {
          if (currentIndex + 1 >= words.length) {
            onFinish(score, updatedWrongs, updatedHistory);
          } else {
            setCurrentIndex((prev) => prev + 1);
          }
        }, 450);
      }
    }
  }, [
    currentWord,
    history,
    score,
    currentIndex,
    words.length,
    onFinish,
    wrongWords,
    options,
  ]);

  // Stable options ref update
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // When word changes, set options & automatically speak word
  useEffect(() => {
    if (!currentWord) return;
    const newOpts = generateLaneOptions(currentWord);
    optionsRef.current = newOpts;
    setOptions(newOpts);
    gateProgressRef.current = 0;
    setGateProgress(0);
    isEvaluatingRef.current = false;
    setIsEvaluating(false);
    setStatusEffect('none');

    // Auto-speak English word on entrance
    setIsSpeaking(true);
    speakWord(currentWord.word, () => setIsSpeaking(false));
  }, [currentIndex, currentWord, generateLaneOptions]);

  // Pronounce word button
  const handlePronounce = () => {
    if (isSpeaking || !currentWord) return;
    setIsSpeaking(true);
    speakWord(currentWord.word, () => setIsSpeaking(false));
  };

  // Frame Loop / Timer for approaching gate
  // Normal speed: ~4.5 seconds to reach 100%
  // Slowed speed: ~7.0 seconds to reach 100%
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animFrame: number;

    const tick = (time: number) => {
      const delta = Math.min(100, Math.max(0, time - lastTimeRef.current));
      lastTimeRef.current = time;

      if (!isPausedRef.current && !isEvaluatingRef.current) {
        // Dynamic speed acceleration:
        // Base normal duration: 4500ms (4.5s)
        // Each correct answer reduces descent time by 180ms
        // Each consecutive streak combo reduces descent time by another 80ms
        // MAXIMUM SPEED LIMIT (최대 속도 제한):
        // Minimum descent time is capped at 2000ms (2.0s) -> speed will never exceed this safe limit
        const currentCorrect = correctCountRef.current;
        const currentStreak = streakRef.current;
        const speedReduction = Math.min(2500, currentCorrect * 180 + currentStreak * 80);
        const dynamicDuration = Math.max(2000, 4500 - speedReduction);
        const duration = isSlowedRef.current ? 6200 : dynamicDuration;
        const progressIncrement = (delta / duration) * 100;

        const next = Math.min(100, gateProgressRef.current + progressIncrement);
        gateProgressRef.current = next;
        setGateProgress(next);

        // Immediate contact check: recognized the instant it hits 100% (physical contact)
        if (next >= 100) {
          handleEvaluateAnswer();
        }
      }

      animFrame = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrame);
  }, [handleEvaluateAnswer]);

  // Cooldown ref to prevent microsecond duplicate synthetic events (0-30ms)
  const lastLaneChangeTimeRef = useRef<number>(0);

  // Handle direct lane change (0, 1, 2)
  const handleLaneChange = useCallback((lane: LaneIndex) => {
    if (isEvaluatingRef.current) return;
    const now = performance.now();
    // 35ms microsecond guard: blocks duplicate synthetic events from same touch without slowing down user taps
    if (now - lastLaneChangeTimeRef.current < 35) {
      return;
    }
    if (lane === currentLaneRef.current) return;

    lastLaneChangeTimeRef.current = now;
    playSound.laneSwitch();
    setCurrentLane(lane);
    currentLaneRef.current = lane;
  }, []);

  // Instant step left: uses synchronized ref so rapid consecutive taps execute immediately with zero lag
  const handleMoveLeft = useCallback(() => {
    if (isEvaluatingRef.current) return;
    const now = performance.now();
    if (now - lastLaneChangeTimeRef.current < 35) return;
    if (currentLaneRef.current > 0) {
      const nextLane = (currentLaneRef.current - 1) as LaneIndex;
      lastLaneChangeTimeRef.current = now;
      playSound.laneSwitch();
      setCurrentLane(nextLane);
      currentLaneRef.current = nextLane;
    }
  }, []);

  // Instant step right: uses synchronized ref so rapid consecutive taps execute immediately with zero lag
  const handleMoveRight = useCallback(() => {
    if (isEvaluatingRef.current) return;
    const now = performance.now();
    if (now - lastLaneChangeTimeRef.current < 35) return;
    if (currentLaneRef.current < 2) {
      const nextLane = (currentLaneRef.current + 1) as LaneIndex;
      lastLaneChangeTimeRef.current = now;
      playSound.laneSwitch();
      setCurrentLane(nextLane);
      currentLaneRef.current = nextLane;
    }
  }, []);

  // Instant rush
  const handleRush = () => {
    if (isEvaluatingRef.current) return;
    gateProgressRef.current = 100;
    setGateProgress(100);
    handleEvaluateAnswer();
  };

  // Speed factor and max speed limit for UI display
  const speedReduction = Math.min(2500, correctCount * 180 + streak * 80);
  const currentDuration = Math.max(2000, 4500 - speedReduction);
  const isMaxSpeed = currentDuration <= 2000;
  const speedMultiplier = (4500 / currentDuration).toFixed(1);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-between min-h-[92vh] py-3 px-3 sm:px-4">
      {/* 1. TOP HEADER: 남은 단어 수 (6/30) & 점수 (+100) & Status */}
      <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-md">
        {/* Left: Progress / 남은 단어 수 (6/30 형식) */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                단어 번호
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {difficulty === 'easy' ? '🟢 쉬움' : difficulty === 'medium' ? '🟡 중간' : '🔴 어려움'}
              </span>
            </div>
            <span className="text-base sm:text-lg font-black text-cyan-400 font-mono">
              {currentIndex + 1} / {words.length}
            </span>
          </div>
        </div>

        {/* Center: Streak / Speed HUD Badge */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {streak > 1 && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-slate-950" />
              <span>{streak} 콤보!</span>
            </div>
          )}

          {isSlowed ? (
            <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold text-xs px-2.5 py-1 rounded-full animate-pulse">
              <span>🐢 슬로우 모드</span>
            </div>
          ) : isMaxSpeed ? (
            <div className="flex items-center gap-1 bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-bounce">
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>⚡ MAX 속도 ({speedMultiplier}x)</span>
            </div>
          ) : correctCount > 0 ? (
            <div className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-black text-xs px-2.5 py-1 rounded-full shadow">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{speedMultiplier}x 속도</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1 bg-slate-800 text-slate-400 font-bold text-[11px] px-2 py-0.5 rounded-full">
              <span>1.0x 기본 속도</span>
            </div>
          )}
        </div>

        {/* Right: 점수 (+100점당) & Pause Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              점수
            </span>
            <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
              {score.toLocaleString()}P
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isPaused ? '게임 재개' : '일시정지'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Warning Banner if Slowed (슬로우 효과 경고) */}
      {isSlowed && (
        <div className="mt-2 bg-rose-500/20 border border-rose-500/50 px-3 py-1.5 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>⚠️ 속도 저하! (다음 오답 선택 시 즉시 게임 오버)</span>
          </div>
          <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded">
            위험!
          </span>
        </div>
      )}

      {/* 2. SUBWAY SURFERS RUNNING TRACK & OVERHEAD WORD GANTRY */}
      <div className="relative w-full flex-1 flex flex-col justify-center my-1">
        <TrackView
          currentLane={currentLane}
          onLaneChange={handleLaneChange}
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          options={options}
          gateProgress={gateProgress}
          isSlowed={isSlowed}
          statusEffect={statusEffect}
          onRush={handleRush}
          isEvaluating={isEvaluating}
          currentWord={currentWord}
          isSpeaking={isSpeaking}
          onPronounce={handlePronounce}
        />
      </div>

      {/* Paused Overlay Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
            <h3 className="text-xl font-black text-white">일시 정지</h3>
            <p className="text-sm text-slate-400">
              잠시 숨을 고르고 계속 달려보세요!
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
              >
                계속 달리기
              </button>
              <button
                type="button"
                onClick={onExitToMenu}
                className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 flex items-center justify-center gap-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>처음 화면으로</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
