export type RoundType = 'Movie' | 'Song';

export type Round = {
  type: RoundType;
  language: string;
  genre: string;
  answer: string;
  aliases: string[];
  clues: string[];
  createdAt: number;
  createdBy: string;
};

export type Recommendation = {
  username: string;
  title: string;
  reason: string;
  createdAt: number;
};

export type RoundResponse = {
  type: 'round';
  postId: string;
  username: string;
  round: Round;
  recommendations: Recommendation[];
};

export type RecommendationResponse = {
  type: 'recommendation';
  recommendation: Recommendation;
};

// Kept for the unused starter counter hook until that example is removed.
export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};
