// @ts-nocheck

import { http, HttpResponse } from 'msw';
import { SafetyStatus, UserSafetyStatus } from '../types/safety-check';

let tagReviewEnabled = false;

let pendingReviews = [
  {
    id: '1',
    taggingUser: {
      displayName: 'John Doe',
    },
    post: {
      content: 'Check out this cool photo!',
    },
  },
  {
    id: '2',
    taggingUser: {
      displayName: 'Jane Smith',
    },
    post: {
      content: 'Had a great time at the conference!',
    },
  },
];

const safetyStatusesByCrisis: { [crisisId: string]: UserSafetyStatus[] } = {};

// --- Auth endpoints ---
const authHandlers = [
  http.post('*/auth/signup', async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: 'Validation failed', statusCode: 400 },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      message: 'Signup successful. Please check your email to verify your account.',
    });
  }),

  http.post('*/auth/signin', async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: 'Validation failed', statusCode: 400 },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      user: { id: 'user-1', email: body.email, username: 'testuser' },
    });
  }),

  http.post('*/auth/resend-verification', () => {
    return HttpResponse.json({
      message: 'If a user with that email exists, a verification email has been sent.',
    });
  }),

  http.post('*/auth/forgot-password', () => {
    return HttpResponse.json({
      message: 'If a user with that email exists, a password reset link has been sent.',
    });
  }),

  http.post('*/auth/reset-password', () => {
    return HttpResponse.json({ message: 'Password has been reset successfully.' });
  }),
];

export const handlers = [
  ...authHandlers,
  http.get('/api/profile-review/pending', () => {
    return HttpResponse.json(pendingReviews);
  }),

  http.post('/api/profile-review/:id/approve', ({ params }) => {
    const { id } = params;
    pendingReviews = pendingReviews.filter((review) => review.id !== id);
    return new HttpResponse(null, { status: 200 });
  }),

  http.post('/api/profile-review/:id/reject', ({ params }) => {
    const { id } = params;
    pendingReviews = pendingReviews.filter((review) => review.id !== id);
    return new HttpResponse(null, { status: 200 });
  }),

  http.patch('/api/users/me', async ({ request }) => {
    const body = await request.json();
    if (typeof body.tagReviewEnabled === 'boolean') {
      tagReviewEnabled = body.tagReviewEnabled;
    }
    return HttpResponse.json({ tagReviewEnabled });
  }),

  http.get('/api/users/me', () => {
    return HttpResponse.json({ tagReviewEnabled });
  }),

  http.get('/api/crisis-events/:id/safety-status', ({ params }) => {
    const crisisId = params.id as string;
    if (!safetyStatusesByCrisis[crisisId]) {
      safetyStatusesByCrisis[crisisId] = [];
    }
    return HttpResponse.json(safetyStatusesByCrisis[crisisId]);
  }),

  http.post('/api/crisis-events/:id/safety-status', async ({ request, params }) => {
    const crisisId = params.id as string;
    const { userId, status } = await request.json() as { userId: string, status: SafetyStatus };

    if (!safetyStatusesByCrisis[crisisId]) {
      safetyStatusesByCrisis[crisisId] = [];
    }

    const userStatus = safetyStatusesByCrisis[crisisId].find(s => s.userId === userId);

    if (userStatus) {
      userStatus.status = status;
      userStatus.timestamp = Date.now();
    } else {
      safetyStatusesByCrisis[crisisId].push({ userId, status, timestamp: Date.now() });
    }

    return HttpResponse.json(safetyStatusesByCrisis[crisisId]);
  }),
];