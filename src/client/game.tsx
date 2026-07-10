import './index.css';

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

const sampleRounds = [
  {
    type: 'Movie',
    language: 'Hindi',
    genre: 'Comedy Drama',
    answer: '3 Idiots',
    aliases: ['3 idiots', 'three idiots', '3idiots'],
    clues: [
      'Bro entered engineering jail and chose vibes over placement package.',
      '🎓📚🤖😭🏃‍♂️',
      'Aamir Khan, R. Madhavan, Sharman Joshi',
    ],
  },
  {
    type: 'Song',
    language: 'English',
    genre: '2000s Rap / Pop',
    answer: 'Low',
    aliases: ['low', 'low flo rida', 'apple bottom jeans'],
    clues: [
      'The club witnessed gravity defeat denim.',
      '👖🥾⬇️🕺',
      'A late-2000s party song with an instantly recognizable clothing-based opening.',
    ],
  },
  {
    type: 'Song',
    language: 'Hindi',
    genre: 'Romantic',
    answer: 'Tum Hi Ho',
    aliases: ['tum hi ho', 'aashiqui 2 tum hi ho'],
    clues: [
      'Bro turned one situationship into his entire personality.',
      '🌧️💔🎤🖤',
      'A very famous romantic song from Aashiqui 2.',
    ],
  },
];

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const App = () => {
  const [roundIndex, setRoundIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [visibleClues, setVisibleClues] = useState(1);
  const [message, setMessage] = useState('');
  const [gaveUp, setGaveUp] = useState(false);
  const [recommendation, setRecommendation] = useState('');
  const [savedRecommendation, setSavedRecommendation] = useState('');

  const sampleRound = sampleRounds[roundIndex];

  const checkGuess = () => {
    const possibleAnswers = [sampleRound.answer, ...sampleRound.aliases];

    const isCorrect = possibleAnswers.some(
      (answer) => normalize(answer) === normalize(guess)
    );

    if (isCorrect) {
      setMessage('Correct! You decoded it. Now recommend something similar.');
      setGaveUp(true);
    } else {
      setMessage('Not quite. Try another clue.');
    }
  };

  const unlockClue = () => {
    if (visibleClues < sampleRound.clues.length) {
      setVisibleClues(visibleClues + 1);
      setMessage('');
    } else {
      setMessage('No more clues. Guess or give up.');
    }
  };

  const giveUp = () => {
    setGaveUp(true);
    setMessage('You gave up. The answer is revealed below.');
  };

  const submitRecommendation = () => {
    if (recommendation.trim().length === 0) {
      setSavedRecommendation('Type a recommendation first.');
      return;
    }

    setSavedRecommendation(recommendation);
    setRecommendation('');
  };

  const nextRound = () => {
    const nextIndex = (roundIndex + 1) % sampleRounds.length;

    setRoundIndex(nextIndex);
    setGuess('');
    setVisibleClues(1);
    setMessage('');
    setGaveUp(false);
    setRecommendation('');
    setSavedRecommendation('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-bold text-center mb-2">Pop Decode</h1>

        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Decode the movie or song from cursed clues.
        </p>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 shadow-md">
          <div className="mb-4">
            <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Round {roundIndex + 1} of {sampleRounds.length}
            </p>

            <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mt-2">
              Guess the {sampleRound.type}
            </p>

            <h2 className="text-2xl font-bold mt-1">
              {sampleRound.language} • {sampleRound.genre}
            </h2>
          </div>

          <div className="space-y-3 mb-5">
            {sampleRound.clues.slice(0, visibleClues).map((clue, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
              >
                <p className="font-semibold mb-1">Clue {index + 1}</p>
                <p>{clue}</p>
              </div>
            ))}
          </div>

          {!gaveUp && (
            <>
              <input
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 mb-3"
                placeholder="Enter your guess..."
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
              />

              <div className="flex gap-2 flex-wrap">
                <button
                  className="bg-orange-600 text-white px-4 py-2 rounded-full font-semibold"
                  onClick={checkGuess}
                >
                  Guess
                </button>

                <button
                  className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full font-semibold"
                  onClick={unlockClue}
                >
                  Unlock Clue
                </button>

                <button
                  className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full font-semibold"
                  onClick={giveUp}
                >
                  Give Up
                </button>

                <button
                  className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full font-semibold"
                  onClick={nextRound}
                >
                  Next Round
                </button>
              </div>
            </>
          )}

          {message && (
            <p className="mt-4 font-semibold text-orange-600 dark:text-orange-400">
              {message}
            </p>
          )}

          {gaveUp && (
            <div className="mt-6 border-t border-gray-300 dark:border-gray-700 pt-5">
              <p className="text-lg font-bold">Answer: {sampleRound.answer}</p>

              <div className="mt-4">
                <label className="font-semibold">
                  Recommend something similar:
                </label>

                <input
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 mt-2 mb-3"
                  placeholder="Example: Taare Zameen Par"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                />

                <div className="flex gap-2 flex-wrap">
                  <button
                    className="bg-orange-600 text-white px-4 py-2 rounded-full font-semibold"
                    onClick={submitRecommendation}
                  >
                    Submit Recommendation
                  </button>

                  <button
                    className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full font-semibold"
                    onClick={nextRound}
                  >
                    Next Round
                  </button>
                </div>

                {savedRecommendation && (
                  <p className="mt-4">
                    Community recommendation:{' '}
                    <span className="font-semibold">{savedRecommendation}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);