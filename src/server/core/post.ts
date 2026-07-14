import { reddit } from '@devvit/web/server';

type CreatePostOptions = {
  title: string;
};

export const createPost = async (
  { title }: CreatePostOptions = { title: 'Pop Decode' }
) => {
  return await reddit.submitCustomPost({
    title,
    entry: 'default',
  });
};
