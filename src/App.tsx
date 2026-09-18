import { useState } from 'react';
import { GameScreenType, WordItem, QuestionHistory, DifficultyLevel } from './types';
import { getRandomWords } from './data/words';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreenType>('start');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [sessionWords, setSessionWords] = useState<WordItem[]>(() => getRandomWords('easy', 30));
  const [score, setScore] = useState<number>(0);
  const [wrongWords, setWrongWords] = useState<WordItem[]>([]);
  const [history, setHistory] = useState<QuestionHistory[]>([]);

  const handleStartGame = (selectedDiff?: DifficultyLevel) => {
    const activeDifficulty = selectedDiff || difficulty;
    if (selectedDiff) {
      setDifficulty(selectedDiff);
    }
    // Randomly select 30 words from the 100-word bank of the chosen difficulty
    const freshWords = getRandomWords(activeDifficulty, 30);
    setSessionWords(freshWords);
    setScore(0);
    setWrongWords([]);
    setHistory([]);
    setCurrentScreen('playing');
  };

  const handleFinishGame = (
    finalScore: number,
    wrongs: WordItem[],
    questionHistory: QuestionHistory[]
  ) => {
    setScore(finalScore);
    setWrongWords(wrongs);
    setHistory(questionHistory);
    setCurrentScreen('result');
  };

  const handleRetry = () => {
    // Refresh with another random 30 words on the same difficulty level
    const freshWords = getRandomWords(difficulty, 30);
    setSessionWords(freshWords);
    setScore(0);
    setWrongWords([]);
    setHistory([]);
    setCurrentScreen('playing');
  };

  const handleGoHome = () => {
    setCurrentScreen('start');
  };

  const handleNextSet = () => {
    // Generate another set of 30 randomized words
    const freshWords = getRandomWords(difficulty, 30);
    setSessionWords(freshWords);
    setScore(0);
    setWrongWords([]);
    setHistory([]);
    setCurrentScreen('playing');
  };

  return (
    <main
      id="vocarun-app"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 selection:bg-cyan-500 selection:text-slate-950"
    >
      {/* Dynamic Screen Rendering */}
      {currentScreen === 'start' && (
        <StartScreen
          onStart={handleStartGame}
          selectedDifficulty={difficulty}
          onSelectDifficulty={(diff) => setDifficulty(diff)}
        />
      )}

      {currentScreen === 'playing' && (
        <GameScreen
          words={sessionWords}
          difficulty={difficulty}
          onFinish={handleFinishGame}
          onExitToMenu={handleGoHome}
        />
      )}

      {currentScreen === 'result' && (
        <ResultScreen
          score={score}
          totalWordsCount={sessionWords.length}
          wrongWords={wrongWords}
          history={history}
          difficulty={difficulty}
          onRetry={handleRetry}
          onGoHome={handleGoHome}
          onNextSet={handleNextSet}
        />
      )}
    </main>
  );
}
