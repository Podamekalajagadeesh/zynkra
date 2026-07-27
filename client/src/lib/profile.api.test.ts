import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getProfile, getUserProfile, updateProfile } from './api';

describe('getProfile API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches the current user profile', async () => {
    server.use(
      http.get('*/users/me', () => {
        return HttpResponse.json({
          id: 'user-1',
          username: 'testuser',
          displayName: 'Test User',
          bio: 'Hello world',
          avatar: '/avatar.jpg',
          following: [],
          followers: [],
        });
      }),
      http.get('*/users/:id/posts', () => {
        return HttpResponse.json([]);
      })
    );

    const profile = await getProfile();

    expect(profile.username).toBe('testuser');
    expect(profile.displayName).toBe('Test User');
    expect(profile.bio).toBe('Hello world');
    expect(profile.avatar).toBe('/avatar.jpg');
  });

  it('attaches posts to the profile', async () => {
    server.use(
      http.get('*/users/me', () => {
        return HttpResponse.json({
          id: 'user-1',
          username: 'testuser',
          posts: [],
          featuredPosts: [],
        });
      }),
      http.get('*/users/user-1/posts', () => {
        return HttpResponse.json([
          { id: 'post-1', content: 'Hello' },
          { id: 'post-2', content: 'World', isFeatured: true },
        ]);
      })
    );

    const profile = await getProfile();

    expect(profile.posts).toHaveLength(2);
    expect(profile.featuredPosts).toHaveLength(1);
  });

  it('returns profile with empty posts when user has no ID', async () => {
    server.use(
      http.get('*/users/me', () => {
        return HttpResponse.json({
          id: undefined,
          username: 'testuser',
        });
      })
    );

    const profile = await getProfile();

    expect(profile.posts).toEqual([]);
    expect(profile.featuredPosts).toEqual([]);
  });

  it('throws on API error', async () => {
    server.use(
      http.get('*/users/me', () => {
        return HttpResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      })
    );

    await expect(getProfile()).rejects.toThrow();
  });
});

describe('getUserProfile API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches a user profile by ID', async () => {
    server.use(
      http.get('*/users/user-123', () => {
        return HttpResponse.json({
          id: 'user-123',
          username: 'otheruser',
          displayName: 'Other User',
          bio: 'Other bio',
        });
      }),
      http.get('*/users/user-123/posts', () => {
        return HttpResponse.json([{ id: 'post-1' }]);
      })
    );

    const profile = await getUserProfile('user-123');

    expect(profile.username).toBe('otheruser');
    expect(profile.displayName).toBe('Other User');
    expect(profile.posts).toHaveLength(1);
  });

  it('sends pagination params', async () => {
    let capturedUrl: string = '';

    server.use(
      http.get('*/users/user-456', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ id: 'user-456', username: 'paginated' });
      }),
      http.get('*/users/user-456/posts', () => {
        return HttpResponse.json([]);
      })
    );

    await getUserProfile('user-456', 5, 10);

    expect(capturedUrl).toContain('take=5');
    expect(capturedUrl).toContain('skip=10');
  });

  it('throws on 404 not found', async () => {
    server.use(
      http.get('*/users/nonexistent', () => {
        return HttpResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      })
    );

    await expect(getUserProfile('nonexistent')).rejects.toThrow();
  });
});

describe('updateProfile API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends PATCH to /users/profile with FormData', async () => {
    server.use(
      http.patch('*/users/profile', () => {
        return HttpResponse.json({
          id: 'user-1',
          username: 'updated',
          displayName: 'Updated Name',
          bio: 'Updated bio',
        });
      })
    );

    const formData = new FormData();
    formData.append('displayName', 'Updated Name');
    formData.append('bio', 'Updated bio');
    const result = await updateProfile(formData);

    expect(result.username).toBe('updated');
    expect(result.displayName).toBe('Updated Name');
  });

  it('handles avatar file upload in FormData', async () => {
    server.use(
      http.patch('*/users/profile', () => {
        return HttpResponse.json({ id: 'user-1', username: 'testuser' });
      })
    );

    const formData = new FormData();
    formData.append('displayName', 'Test');
    formData.append('avatar', new Blob(['fake-image'], { type: 'image/jpeg' }), 'avatar.jpg');
    const result = await updateProfile(formData);

    expect(result.username).toBe('testuser');
  });

  it('throws on API error', async () => {
    server.use(
      http.patch('*/users/profile', () => {
        return HttpResponse.json(
          { message: 'Failed to update profile' },
          { status: 400 }
        );
      })
    );

    const formData = new FormData();
    formData.append('displayName', 'Test');

    await expect(updateProfile(formData)).rejects.toThrow();
  });
});
