import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import {
  addBookmark, removeBookmark, getBookmarks,
  createCollection, getCollections, getCollection,
  updateCollection, deleteCollection,
} from './api';

describe('addBookmark API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /bookmarks', async () => {
    let capturedBody: any;
    server.use(
      http.post('*/bookmarks', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 'bm-1' });
      })
    );

    await addBookmark('post-1', 'col-1');
    expect(capturedBody).toEqual({ postId: 'post-1', collectionId: 'col-1' });
  });

  it('sends POST without collectionId', async () => {
    let capturedBody: any;
    server.use(
      http.post('*/bookmarks', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 'bm-1' });
      })
    );

    await addBookmark('post-1', null);
    expect(capturedBody).toEqual({ postId: 'post-1', collectionId: null });
  });
});

describe('removeBookmark API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends DELETE to /bookmarks/:postId', async () => {
    let capturedUrl = '';
    server.use(
      http.delete('*/bookmarks/post-1', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ message: 'Removed' });
      })
    );

    await removeBookmark('post-1');
    expect(capturedUrl).toContain('post-1');
  });
});

describe('getBookmarks API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches bookmarks list', async () => {
    server.use(
      http.get('*/bookmarks', () => {
        return HttpResponse.json([
          { id: 'bm-1', post: { id: 'post-1' } },
        ]);
      })
    );

    const result = await getBookmarks();
    expect(result).toHaveLength(1);
  });
});

describe('createCollection API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /collections', async () => {
    let capturedBody: any;
    server.use(
      http.post('*/collections', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 'col-1', name: 'Favorites' });
      })
    );

    const result = await createCollection('Favorites');
    expect(capturedBody).toEqual({ name: 'Favorites' });
    expect(result.name).toBe('Favorites');
  });
});

describe('getCollections API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches collections list', async () => {
    server.use(
      http.get('*/collections', () => {
        return HttpResponse.json([{ id: 'col-1', name: 'Favorites' }]);
      })
    );

    const result = await getCollections();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Favorites');
  });
});

describe('updateCollection API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends PATCH to /collections/:id', async () => {
    let capturedBody: any;
    server.use(
      http.patch('*/collections/col-1', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 'col-1', name: 'Renamed' });
      })
    );

    const result = await updateCollection('col-1', 'Renamed');
    expect(capturedBody).toEqual({ name: 'Renamed' });
    expect(result.name).toBe('Renamed');
  });
});

describe('deleteCollection API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends DELETE to /collections/:id', async () => {
    server.use(
      http.delete('*/collections/col-1', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    await deleteCollection('col-1');
  });
});
