import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';

export const menu = new Hono();

menu.post('/create-round', (c) => {
  return c.json<UiResponse>({
    showForm: {
      name: 'createRoundForm',
      form: {
        title: 'Create Pop Decode Round',
        description: 'One custom post will be created for this round.',
        acceptLabel: 'Create Round',
        fields: [
          {
            type: 'select',
            name: 'type',
            label: 'Type',
            required: true,
            defaultValue: ['Movie'],
            options: [
              { label: 'Movie', value: 'Movie' },
              { label: 'Song', value: 'Song' },
            ],
          },
          {
            type: 'string',
            name: 'language',
            label: 'Language, country, or origin',
            required: true,
          },
          { type: 'string', name: 'genre', label: 'Genre', required: true },
          {
            type: 'string',
            name: 'answer',
            label: 'Answer',
            required: true,
          },
          {
            type: 'string',
            name: 'aliases',
            label: 'Aliases',
            helpText:
              'Optional. Separate aliases with commas. Example: three idiots, 3idiots',
          },
          { type: 'paragraph', name: 'clue1', label: 'Clue 1' },
          { type: 'paragraph', name: 'clue2', label: 'Clue 2' },
          { type: 'paragraph', name: 'clue3', label: 'Clue 3' },
        ],
      },
    },
  });
});
