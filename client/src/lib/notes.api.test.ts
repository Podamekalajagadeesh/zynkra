import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { createNote, getFollowingNotes, getUserNote, deleteNote } from './api/notes';

describe('Notes API', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('creates a note', async () => {
    server.use(
      http.post('*/notes', () => {
        return HttpResponse.json({ id: 'note-1', content: 'Hello', userId: 'user-1' });
      })
    );

    const result = await createNote('Hello');
    expect(result.id).toBe('note-1');
    expect(result.content).toBe('Hello');
  });

  it('fetches following notes', async () => {
    server.use(
      http.get('*/notes/following', () => {
        return HttpResponse.json([{ id: 'note-1', content: 'First', userId: 'user-2' }]);
      })
    );

    const result = await getFollowingNotes();
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('First');
  });

  it('fetches a user note', async () => {
    server.use(
      http.get('*/notes/user/user-1', () => {
        return HttpResponse.json({ id: 'note-1', content: 'User note', userId: 'user-1' });
      })
    );

    const result = await getUserNote('user-1');
    expect(result).not.toBeNull();
    expect(result!.content).toBe('User note');
  });

  it('deletes a note', async () => {
    server.use(
      http.delete('*/notes/note-1', () => {
        return HttpResponse.json({});
      })
    );

    await expect(deleteNote('note-1')).resolves.not.toThrow();
  });
});
