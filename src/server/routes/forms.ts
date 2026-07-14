import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context, redis, reddit } from '@devvit/web/server';
import type { Round, RoundType } from '../../shared/api';
import { createPost } from '../core/post';

type CreateRoundFormValues = {
  type?: string[];
  language?: string;
  genre?: string;
  answer?: string;
  aliases?: string;
  clue1?: string;
  clue2?: string;
  clue3?: string;
};

export const forms = new Hono();

forms.post('/create-round-submit', async (c) => {
  const values = await c.req.json<CreateRoundFormValues>();
  const language = values.language?.trim() ?? '';
  const genre = values.genre?.trim() ?? '';
  const answer = values.answer?.trim() ?? '';
  const clues = [values.clue1, values.clue2, values.clue3]
    .map((clue) => clue?.trim() ?? '')
    .filter((clue) => clue.length > 0);

  if (!language || !genre || !answer || clues.length === 0) {
    return c.json<UiResponse>(
      {
        showToast: 'Language, genre, answer, and at least one clue are required.',
      },
      400
    );
  }

  const selectedType = values.type?.[0];
  const type: RoundType = selectedType === 'Song' ? 'Song' : 'Movie';
  const aliases = (values.aliases ?? '')
    .split(',')
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);

  try {
    const [createdBy, post] = await Promise.all([
      reddit.getCurrentUsername(),
      createPost({ title: `Pop Decode: ${type} • ${language} • ${genre}` }),
    ]);
    const round: Round = {
      type,
      language,
      genre,
      answer,
      aliases,
      clues,
      createdAt: Date.now(),
      createdBy: createdBy ?? context.username ?? 'unknown',
    };

    const storedRound = JSON.stringify(round);
    const barePostId = post.id.replace(/^t3_/, '');
    await Promise.all([
      redis.set(`round:${post.id}`, storedRound),
      redis.set(`round:${barePostId}`, storedRound),
    ]);

    return c.json<UiResponse>({
      showToast: { text: 'Pop Decode round created!', appearance: 'success' },
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error('Failed to create Pop Decode round:', error);
    return c.json<UiResponse>({ showToast: 'Failed to create round.' }, 500);
  }
});
