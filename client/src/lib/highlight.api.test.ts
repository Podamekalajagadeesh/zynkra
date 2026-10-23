import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import {
  getUserHighlights,
  getHighlight,
  createHighlight,
  updateHighlight,
  deleteHighlight,
} from './api';

describe('highlight API helpers', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('getUserHighlights fetches /users/:username/highlights (url-encoded)', async () => {
    let capturedPath = '';
    server.use(
      http.get('*/users/:username/highlights', ({ params }) => {
        capturedPath = `/users/${params.username}/highlights`;
        return HttpResponse.json([{ id: 'h1', title: 'Best', coverUrl: '/c.jpg', stories: [] }]);
      })
    );

    const result = await getUserHighlights('ada lovelace');
    // MSW reports the decoded param; matching at all proves the username rode
    // as a single (encoded) path segment into /users/:username/highlights.
    expect(capturedPath).toBe('/users/ada lovelace/highlights');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('h1');
  });

  it('getHighlight fetches /stories/highlights/:id', async () => {
    let captured = '';
    server.use(
      http.get('*/stories/highlights/:id', ({ params }) => {
        captured = String(params.id);
        return HttpResponse.json({ id: 'h9', title: 'Mine', coverUrl: '/c.jpg', stories: [] });
      })
    );

    const result = await getHighlight('h9');
    expect(captured).toBe('h9');
    expect(result.title).toBe('Mine');
  });

  it('createHighlight POSTs title, coverUrl, and storyIds', async () => {
    let capturedBody: unknown;
    server.use(
      http.post('*/stories/highlights', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 'h1' }, { status: 201 });
      })
    );

    const result = await createHighlight({
      title: 'Best of',
      coverUrl: '/c.jpg',
      storyIds: ['s1', 's2'],
    });
    expect(capturedBody).toEqual({ title: 'Best of', coverUrl: '/c.jpg', storyIds: ['s1', 's2'] });
    expect(result.id).toBe('h1');
  });

  it('updateHighlight PATCHes only the provided fields', async () => {
    let capturedPath = '';
    let capturedBody: unknown;
    server.use(
      http.patch('*/stories/highlights/:id', async ({ params, request }) => {
        capturedPath = String(params.id);
        capturedBody = await request.json();
        return HttpResponse.json({ id: params.id, title: 'Renamed' });
      })
    );

    await updateHighlight('h1', { title: 'Renamed' });
    expect(capturedPath).toBe('h1');
    expect(capturedBody).toEqual({ title: 'Renamed' });
  });

  it('deleteHighlight DELETEs the highlight', async () => {
    let capturedPath = '';
    let method = '';
    server.use(
      http.delete('*/stories/highlights/:id', ({ params, request }) => {
        capturedPath = String(params.id);
        method = request.method;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    await deleteHighlight('h1');
    expect(method).toBe('DELETE');
    expect(capturedPath).toBe('h1');
  });

  it('propagates failures so callers can show an error state', async () => {
    server.use(
      http.get('*/users/:username/highlights', () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
      )
    );

    await expect(getUserHighlights('bob')).rejects.toThrow();
  });
});
