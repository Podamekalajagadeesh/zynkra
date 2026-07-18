
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

export const handlers = [
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