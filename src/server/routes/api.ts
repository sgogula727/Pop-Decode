import { Hono } from 'hono';
import { context, redis } from '@devvit/web/server';
import type {
  Recommendation,
  RecommendationResponse,
  Round,
  RoundResponse,
} from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

type RecommendationRequest = {
  title?: string;
  reason?: string;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isRound = (value: unknown): value is Round => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'type' in value &&
    (value.type === 'Movie' || value.type === 'Song') &&
    'language' in value &&
    typeof value.language === 'string' &&
    'genre' in value &&
    typeof value.genre === 'string' &&
    'answer' in value &&
    typeof value.answer === 'string' &&
    'aliases' in value &&
    isStringArray(value.aliases) &&
    'clues' in value &&
    isStringArray(value.clues) &&
    'createdAt' in value &&
    typeof value.createdAt === 'number' &&
    'createdBy' in value &&
    typeof value.createdBy === 'string'
  );
};

const isRecommendation = (value: unknown): value is Recommendation => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'username' in value &&
    typeof value.username === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'reason' in value &&
    typeof value.reason === 'string' &&
    'createdAt' in value &&
    typeof value.createdAt === 'number'
  );
};

const parseRecommendation = (value: string) => {
  const parsed: unknown = JSON.parse(value);
  return isRecommendation(parsed) ? parsed : null;
};

export const api = new Hono();

api.get('/round', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Current post ID is missing.' },
      400
    );
  }

  try {
    const barePostId = postId.replace(/^t3_/, '');
    const fullPostId = postId.startsWith('t3_') ? postId : `t3_${postId}`;
    const [exactRound, bareRound, fullRound] = await Promise.all([
      redis.get(`round:${postId}`),
      redis.get(`round:${barePostId}`),
      redis.get(`round:${fullPostId}`),
    ]);
    const storedRound = exactRound ?? bareRound ?? fullRound;
    if (!storedRound) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'No Pop Decode round was found for this post.' },
        404
      );
    }

    const parsedRound: unknown = JSON.parse(storedRound);
    if (!isRound(parsedRound)) {
      throw new Error('Stored round has an invalid shape.');
    }

    const storedRecommendations = await redis.zRange(
      `recommendations:${postId}`,
      0,
      -1
    );
    const recommendations = storedRecommendations
      .map(({ member }) => parseRecommendation(member))
      .filter((item) => item !== null);

    return c.json<RoundResponse>({
      type: 'round',
      postId,
      username: context.username ?? 'anonymous',
      round: parsedRound,
      recommendations,
    });
  } catch (error) {
    console.error(`Failed to load round for ${postId}:`, error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to load this round.' },
      500
    );
  }
});

api.post('/recommendations', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Current post ID is missing.' },
      400
    );
  }

  const values = await c.req.json<RecommendationRequest>();
  const title = values.title?.trim() ?? '';
  const reason = values.reason?.trim() ?? '';

  if (!title) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'A recommendation title is required.' },
      400
    );
  }

  const recommendation: Recommendation = {
    username: context.username ?? 'anonymous',
    title,
    reason,
    createdAt: Date.now(),
  };

  await redis.zAdd(`recommendations:${postId}`, {
    member: JSON.stringify(recommendation),
    score: recommendation.createdAt,
  });

  return c.json<RecommendationResponse>({
    type: 'recommendation',
    recommendation,
  });
});
