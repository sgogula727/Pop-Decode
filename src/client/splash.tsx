import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { RoundResponse } from '../shared/api';

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const Splash = () => {
  const [roundData, setRoundData] = useState<RoundResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadRound = async () => {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const response = await fetch('/api/round');

        if (response.ok) {
          const data: RoundResponse = await response.json();
          if (!cancelled) setRoundData(data);
          return;
        }

        if (response.status === 404 && attempt < 5) {
          await wait(600);
          continue;
        }

        if (!cancelled) {
          setError('This post does not contain a Pop Decode round.');
        }
        return;
      }
    };

    void loadRound();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex items-start justify-center px-4 py-4">
      <div className="sticky top-4 w-full max-w-xl bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-orange-600 dark:text-orange-400 font-semibold">
              Pop Decode
            </p>
            <h1 className="text-2xl font-bold">
              {roundData
                ? `Guess the ${roundData.round.type}`
                : error
                  ? 'The Movie and Song Guessing Game'
                  : 'Loading round…'}
            </h1>
          </div>
          <span className="text-3xl" aria-hidden="true">
            🕵️
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-orange-50 dark:bg-gray-900 p-4">
            <h2 className="font-bold mb-2">How to play</h2>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                To create your own round, select “Create Pop Decode Round” from
                the subreddit menu and complete the form.
              </li>
              <li>Read the first clue and try to identify the answer.</li>
              <li>Open the game to guess or unlock up to three clues.</li>
              <li>Guess correctly—or give up—to reveal the answer.</li>
              <li>After the reveal, recommend something similar.</li>
            </ol>
          </div>
        )}

        {roundData && (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {roundData.round.language} • {roundData.round.genre}
            </p>

            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 mb-4">
              <p className="font-semibold mb-1">Clue 1</p>
              <p>{roundData.round.clues[0]}</p>
            </div>
            <button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-full font-semibold"
              onClick={(event) => requestExpandedMode(event.nativeEvent, 'game')}
            >
              Play and unlock more clues
            </button>
          </>
        )}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
