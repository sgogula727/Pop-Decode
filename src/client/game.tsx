import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  Recommendation,
  RecommendationResponse,
  Round,
  RoundResponse,
} from '../shared/api';

const normalize = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]/g, '');

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const App = () => {
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [guess, setGuess] = useState('');
  const [visibleClues, setVisibleClues] = useState(1);
  const [message, setMessage] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [recommendationTitle, setRecommendationTitle] = useState('');
  const [recommendationReason, setRecommendationReason] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [submittingRecommendation, setSubmittingRecommendation] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadRound = async () => {
      const attempts = 5;

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          const response = await fetch('/api/round');
          if (!response.ok) {
            if (response.status === 404 && attempt < attempts) {
              await wait(600);
              continue;
            }

            const error = await response.json();
            throw new Error(
              response.status === 404
                ? 'This post does not contain a Pop Decode round. Create a new round from the subreddit moderator menu.'
                : typeof error.message === 'string'
                  ? error.message
                  : 'Failed to load this round.'
            );
          }

          const data: RoundResponse = await response.json();
          if (!cancelled) {
            setRound(data.round);
            setRecommendations(data.recommendations);
            setLoading(false);
          }
          return;
        } catch (error) {
          if (!cancelled) {
            setLoadError(
              error instanceof Error
                ? error.message
                : 'Failed to load this round.'
            );
            setLoading(false);
          }
          return;
        }
      }
    };

    void loadRound();

    return () => {
      cancelled = true;
    };
  }, []);

  const checkGuess = () => {
    if (!round) return;

    if (!guess.trim()) {
      setMessage('Type a guess first.');
      return;
    }

    const isCorrect = [round.answer, ...round.aliases].some(
      (possibleAnswer) => normalize(possibleAnswer) === normalize(guess)
    );

    if (isCorrect) {
      setMessage('Correct! You decoded it. Now recommend something similar.');
      setRevealed(true);
    } else {
      setMessage('Not quite. Try another clue.');
    }
  };

  const unlockClue = () => {
    if (!round) return;

    if (visibleClues < round.clues.length) {
      setVisibleClues((count) => count + 1);
      setMessage('');
    } else {
      setMessage('No more clues. Guess or give up.');
    }
  };

  const giveUp = () => {
    setRevealed(true);
    setMessage('You gave up. The answer is revealed below.');
  };

  const submitRecommendation = async () => {
    const title = recommendationTitle.trim();
    const reason = recommendationReason.trim();

    if (!title) {
      setMessage('Add a recommendation title first.');
      return;
    }

    setSubmittingRecommendation(true);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, reason }),
      });
      if (!response.ok) throw new Error('Failed to add recommendation.');

      const data: RecommendationResponse = await response.json();
      setRecommendations((items) => [...items, data.recommendation]);
      setRecommendationTitle('');
      setRecommendationReason('');
      setMessage('Recommendation added.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to add recommendation.'
      );
    } finally {
      setSubmittingRecommendation(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-bold text-center mb-2">Pop Decode</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Decode movies and songs from brainrot, emoji, and culture clues.
        </p>

        {loading && <p className="text-center">Loading round…</p>}

        {loadError && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 shadow-md text-center">
            <h2 className="text-xl font-bold mb-2">Round unavailable</h2>
            <p>{loadError}</p>
          </div>
        )}

        {round && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 shadow-md">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Guess the {round.type}
              </p>
              <h2 className="text-2xl font-bold mt-1">
                {round.language} • {round.genre}
              </h2>
            </div>

            <div className="space-y-3 mb-5">
              {round.clues.slice(0, visibleClues).map((clue, index) => (
                <div
                  key={`${index}-${clue}`}
                  className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                >
                  <p className="font-semibold mb-1">Clue {index + 1}</p>
                  <p>{clue}</p>
                </div>
              ))}
            </div>

            {!revealed && (
              <>
                <input
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 mb-3"
                  placeholder="Enter your guess..."
                  value={guess}
                  onChange={(event) => setGuess(event.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                  <button className="bg-orange-600 text-white px-4 py-2 rounded-full font-semibold" onClick={checkGuess}>
                    Guess
                  </button>
                  <button className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full font-semibold" onClick={unlockClue}>
                    Unlock Clue
                  </button>
                  <button className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full font-semibold" onClick={giveUp}>
                    Give Up
                  </button>
                </div>
              </>
            )}

            {message && (
              <p className="mt-4 font-semibold text-orange-600 dark:text-orange-400">
                {message}
              </p>
            )}

            {revealed && (
              <div className="mt-6 border-t border-gray-300 dark:border-gray-700 pt-5">
                <p className="text-lg font-bold">Answer: {round.answer}</p>
                <div className="mt-4">
                  <label className="font-semibold">Recommend something similar:</label>
                  <input
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 mt-2 mb-3"
                    placeholder="Recommendation title"
                    value={recommendationTitle}
                    onChange={(event) => setRecommendationTitle(event.target.value)}
                  />
                  <textarea
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 mb-3 min-h-20"
                    placeholder="Why does it fit?"
                    value={recommendationReason}
                    onChange={(event) => setRecommendationReason(event.target.value)}
                  />
                  <button
                    className="bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2 rounded-full font-semibold"
                    disabled={submittingRecommendation}
                    onClick={submitRecommendation}
                  >
                    {submittingRecommendation ? 'Submitting…' : 'Submit Recommendation'}
                  </button>
                </div>

                {recommendations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-bold mb-3">Community recommendations</h3>
                    <div className="space-y-3">
                      {recommendations.map((recommendation) => (
                        <div
                          key={`${recommendation.username}-${recommendation.createdAt}`}
                          className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                        >
                          <p className="font-semibold">{recommendation.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            u/{recommendation.username}
                          </p>
                          {recommendation.reason && (
                            <p className="text-gray-600 dark:text-gray-300 mt-1">{recommendation.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
